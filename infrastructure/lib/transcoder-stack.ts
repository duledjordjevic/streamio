import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import path = require('path');
import { S3EventSourceV2 } from 'aws-cdk-lib/aws-lambda-event-sources';
import { LambdaDestination } from 'aws-cdk-lib/aws-appconfig';
import { Transcoder } from './constructs/transcoder-construct';

interface TranscoderStackProps extends cdk.StackProps {
    bucketName: string;
    metadata: dynamodb.TableV2;
    stageName?: string;
}

export class TranscoderStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: TranscoderStackProps) {
        super(scope, id, props);

        const prefix = props && props.stageName ? `${props.stageName}-` : '';

        const bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', props.bucketName);

        const dlQueue = new sqs.Queue(this, `${prefix}TranscoderDLQueue`, {
            queueName: 'transcoder-dl-queue',
            encryption: sqs.QueueEncryption.KMS_MANAGED,
            enforceSSL: true,
        })

        const transcoderQueue = new sqs.Queue(this, `${prefix}TranscoderQueue`, {
            queueName: 'transcoder-queue',
            encryption: sqs.QueueEncryption.KMS_MANAGED,
            enforceSSL: true,
            deadLetterQueue: {
                queue: dlQueue,
                maxReceiveCount: 3,
            }
        })

        const addToQueue = new lambda.Function(this, `${prefix}AddToQueue`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'on_s3_object_put.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
            environment: {
                BUCKET_NAME: props.bucketName,
                QUEUE_URL: transcoderQueue.queueUrl,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        bucket.grantRead(addToQueue);
        bucket.grantPut(addToQueue);
        props.metadata.grantReadWriteData(addToQueue);

        addToQueue.addEventSource(new S3EventSourceV2(bucket, {
            events: [s3.EventType.OBJECT_CREATED_PUT],
        }));

        transcoderQueue.grantSendMessages(addToQueue);

        new Transcoder(this, `${prefix}TranscoderConstruct`, {
            bucket: bucket,
            queue: transcoderQueue
        })

    }
}


// https://github.com/aws/aws-cdk/issues/11245
