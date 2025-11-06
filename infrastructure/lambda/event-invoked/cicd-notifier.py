import boto3 # type: ignore
import os

sns = boto3.client("sns")

def handler(event, context):
    detail = event.get("detail", {})
    pipeline_name = detail.get("pipeline", "unknown")
    state = detail.get("state", "unknown")
    execution_id = detail.get("execution-id", "unknown")
    build_info = detail.get("additional-information", {})
    commit_id = build_info.get("sourceVersion", "")
    initiator = build_info.get("initiator", "")

    repo_url = os.environ.get("CODEBUILD_SOURCE_REPO_URL", "")
    trigger = os.environ.get("CODEBUILD_WEBHOOK_TRIGGER", "")
    pr_number = trigger.split("/")[1] if trigger and trigger.startswith("pr/") else None
    pr_url = f"{repo_url.replace('.git','')}/pull/{pr_number}" if pr_number else None

    # Plain text message
    message = f"""
                🚨 *Pipeline Failed*

                Pipeline: {pipeline_name}
                State: {state}
                Execution ID: {execution_id}
                Commit: {commit_id or 'N/A'}
                {f'Pull Request: {pr_url}' if pr_url else ''}
                {f'Triggered by: {initiator}' if initiator else ''}

                🔗 AWS Console: https://console.aws.amazon.com/codepipeline/home#/view/{pipeline_name}
                """

    sns.publish(
        TopicArn=os.environ["TARGET_TOPIC"],
        Message=message,
        Subject=f"Pipeline {pipeline_name} failed"
    )

