import boto3 # type: ignore
import json
import os

sns = boto3.client("sns")

def handler(event, context):
    detail = event.get("detail", {})
    pipeline_name = detail.get("pipeline", "unknown")
    state = detail.get("state", "unknown")
    execution_id = detail.get("execution-id", "unknown")

    formatted = {
        "text": f"🚨 Pipeline Failed\nPipeline: {pipeline_name}\nState: {state}\nExecution ID: {execution_id}"
    }

    sns.publish(
        TopicArn=os.environ["TARGET_TOPIC"],
        Message=json.dumps(formatted),
        Subject=f"Pipeline {pipeline_name} failed"
    )

    return {"statusCode": 200}
