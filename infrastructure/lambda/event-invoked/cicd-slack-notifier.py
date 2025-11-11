import json
import urllib3 # type: ignore
import os 

http = urllib3.PoolManager()

def handler(event, context):
    webhook_url = os.environ['SLACK_WEBHOOK_URL']
    
    detail = event.get('detail', {})
    pipeline_name = detail.get('pipeline', 'Unknown')
    state = detail.get('state', 'UNKNOWN')
    
    if state == 'FAILED':
        emoji = '❌'
        color = 'danger'
    elif state == 'SUCCEEDED':
        emoji = '✅' 
        color = 'good'
    elif state == 'STARTED':
        emoji = '🟡'
        color = '#439FE0'
    else:
        emoji = '🔔'
        color = '#439FE0'
    
    message = {
        "text": f"{emoji} Pipeline {pipeline_name} - {state}",
        "attachments": [
            {
                "color": color,
                "fields": [
                    {
                        "title": "Pipeline",
                        "value": pipeline_name,
                        "short": True
                    },
                    {
                        "title": "Status", 
                        "value": state,
                        "short": True
                    }
                ]
            }
        ]
    }
    
    response = http.request('POST', webhook_url,
        body=json.dumps(message),
        headers={'Content-Type': 'application/json'}
    )
    
    return f"Sent {state} notification for {pipeline_name}"
