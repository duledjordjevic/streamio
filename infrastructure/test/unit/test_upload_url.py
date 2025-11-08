import os
import json
import boto3
import pytest
from moto import mock_aws
import importlib.util

tests_dir = os.path.dirname(__file__)
upload_module_path = os.path.abspath(
    os.path.join(tests_dir, '..', '..', 'lambda', 'presigned-endpoints', 'upload_url.py')
)

spec = importlib.util.spec_from_file_location("upload_url_module", upload_module_path)
upload_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upload_module)

# sada handler radi
handler = upload_module.handler

@pytest.fixture(autouse=True)
def aws_env():
    os.environ['BUCKET_NAME'] = 'dev-streamio-movies-bucket'
    os.environ['METADATA_TABLE'] = 'StreamioMetadata'
    yield
    os.environ.pop('BUCKET_NAME', None)
    os.environ.pop('METADATA_TABLE', None)

@mock_aws
def test_handler_returns_presigned_url_and_writes_metadata():
    # create resources in moto
    s3 = boto3.client('s3', region_name='eu-central-1')
    s3.create_bucket(Bucket='dev-streamio-movies-bucket', CreateBucketConfiguration={'LocationConstraint':'eu-central-1'})

    ddb = boto3.client('dynamodb', region_name='eu-central-1')
    ddb.create_table(
        TableName='StreamioMetadata',
        KeySchema=[{'AttributeName': 'directory', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'directory', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )

    body = {
        "movie_name": "The Departed",
        "uuid": "941081a3",
        "resolution": "240p",
        "description": "desc",
        "actors": "actor1,actor2",
        "directors": "dir1",
        "genres": "drama",
        "thumbnail": "thumb.jpg"
    }
    event = {
        "body": json.dumps(body),
        "headers": {"Content-Type": "application/json"}
    }

    resp = handler(event, None)

    assert resp['statusCode'] == 200
    resp_body = json.loads(resp['body'])
    assert 'upload_url' in resp_body

    upload_url: str = resp_body['upload_url']
    assert 'dev-streamio-movies-bucket.s3' in upload_url
    assert 'The%20Departed-941081a3/240p.mp4' in upload_url or 'The%20Departed-941081a3%2F240p.mp4' in upload_url

    get = ddb.get_item(Key={'directory': {'S': 'The Departed-941081a3'}}, TableName='StreamioMetadata')
    assert 'Item' in get
    item = get['Item']
    assert item['title']['S'] == 'The Departed'
    assert item['uploaded']['BOOL'] == False
    assert item['resolution']['S'] == '240p'

