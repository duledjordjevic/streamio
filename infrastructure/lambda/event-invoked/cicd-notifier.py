import boto3 # type: ignore
import os
import json

sns = boto3.client("sns")

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    detail = event.get("detail", {})
    source = event.get("source", "")
    detail_type = event.get("detail-type", "")
    
    if source == "aws.codepipeline":
        pipeline_name = detail.get("pipeline", "unknown")
        state = detail.get("state", "unknown")
        execution_id = detail.get("execution-id", "unknown")
        
        message = f"""
                    🚨 *Pipeline Execution Failed*

                    Pipeline: {pipeline_name}
                    State: {state}
                    Execution ID: {execution_id}

                    🔗 AWS Console: https://console.aws.amazon.com/codepipeline/home#/view/{pipeline_name}
                """
        subject = f"❌ Pipeline {pipeline_name} Failed"
        
    elif source == "aws.codebuild":
        # CodeBuild event
        project_name = detail.get("project-name", "unknown")
        build_status = detail.get("build-status", "unknown")
        build_id = detail.get("build-id", "unknown")
        
        # Extract additional info
        additional_info = detail.get("additional-information", {})
        initiator = additional_info.get("initiator", "Manual")
        
        # Extract pipeline name from initiator (format: "codepipeline/Pipeline")
        pipeline_name = "unknown"
        if initiator and initiator.startswith("codepipeline/"):
            pipeline_name = initiator.split("/")[1]
        
        # Get source version (commit)
        source_version = additional_info.get("source-version", "")
        commit_id = source_version[:7] if source_version else "N/A"
        
        # Build console URL
        region = context.invoked_function_arn.split(":")[3] if context else "us-east-1"
        build_console_url = f"https://console.aws.amazon.com/codesuite/codebuild/projects/{project_name}/build/{build_id}/?region={region}"
        
        message = f"""
                    🚨 *CodeBuild Failed*

                    Project: {project_name}
                    Status: {build_status}
                    Build ID: {build_id.split('/')[-1] if build_id else 'unknown'}
                    Pipeline: {pipeline_name}
                    Commit: {commit_id}
                    Triggered by: {initiator}

                    🔗 Build Logs: {build_console_url}
                    🔗 Pipeline: https://console.aws.amazon.com/codepipeline/home?region={region}#/view/{pipeline_name}
                    """
        subject = f"❌ CodeBuild {project_name} Failed"
        
    else:
        # Unknown event type
        message = f"""
                🚨 *Unknown Event Failed*

                Source: {source}
                Detail Type: {detail_type}
                Details: {json.dumps(detail, indent=2)}
                """
        subject = "❌ AWS Event Failed"
    
    # Send SNS notification
    sns.publish(
        TopicArn=os.environ["TARGET_TOPIC"],
        Message=message,
        Subject=subject
    )
    
    return {
        "statusCode": 200,
        "body": json.dumps("Notification sent successfully")
    }

