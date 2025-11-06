import os
import json
import boto3

sns = boto3.client('sns')

def handler(event, context):
    # SNS event
    record = event['Records'][0]
    message = json.loads(record['Sns']['Message'])
    
    detail = message.get('detail', {})
    pipeline_name = detail.get('pipeline', 'unknown')
    state = detail.get('state', 'unknown')
    execution_id = detail.get('execution-id', 'unknown')
    
    # CodeBuild info (if build fail)
    build_info = detail.get('additional-information', {})
    source_version = build_info.get('sourceVersion')  
    initiator = build_info.get('initiator')           
    repo_url = build_info.get('source', {}).get('location') or os.environ.get('CODEBUILD_SOURCE_REPO_URL')
    trigger = build_info.get('build-complete-webhook-trigger') or os.environ.get('CODEBUILD_WEBHOOK_TRIGGER')
    
    # PR number (if PR is trigger)
    pr_number = None
    if trigger and trigger.startswith("pr/"):
        pr_number = trigger.split("/")[1]
    
    pr_url = f"{repo_url.replace('.git', '')}/pull/{pr_number}" if pr_number else None
    
    # Format message
    formatted = {
        "text": f"🚨 *Pipeline Failed*\n\n"
                f"*Pipeline:* {pipeline_name}\n"
                f"*State:* {state}\n"
                f"*Execution ID:* {execution_id}\n\n"
                f"*Commit:* {source_version or 'unknown'}\n"
                + (f"*Pull Request:* {pr_url}\n" if pr_url else "")
                + (f"*Triggered by:* {initiator}\n" if initiator else "")
                + f"\n🔗 AWS Console: https://console.aws.amazon.com/codepipeline/home#/view/{pipeline_name}"
    }
    
    # Publish to SNS
    sns.publish(
        TopicArn=os.environ['TARGET_TOPIC'],
        Message=json.dumps(formatted),
        Subject=f"Pipeline {pipeline_name} failed"
    )
    
    return {"statusCode": 200, "body": "Notification sent"}
