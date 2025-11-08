import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as lambdaAuthorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as sqs from 'aws-cdk-lib/aws-sqs'
import path = require('path');


interface FeedStackProps extends cdk.StackProps {
    api: apigatewayv2.HttpApi;
    httpAuthorizer: lambdaAuthorizers.HttpLambdaAuthorizer;
    metadata: dynamodb.TableV2;
    subscriptions: dynamodb.TableV2;
    likes: dynamodb.TableV2;
    history: dynamodb.TableV2;
    feed: dynamodb.TableV2;
    stageName?: string;
}

export class FeedStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: FeedStackProps) {
        super(scope, id, props);

        const prefix = props && props.stageName ? `${props.stageName}-` : '';

        const dlQueue = new sqs.Queue(this, `${prefix}FeedDLQueue`, {
            queueName: `${prefix}feed-dl-queue`,
            encryption: sqs.QueueEncryption.KMS_MANAGED,
            enforceSSL: true,
        })

        const queue = new sqs.Queue(this, `${prefix}FeedQueue`, {
            queueName: `${prefix}feed-queue`,
            encryption: sqs.QueueEncryption.KMS_MANAGED,
            enforceSSL: true,
            deadLetterQueue: {
                queue: dlQueue,
                maxReceiveCount: 3,
            }
        })

        const feedHistory = new lambda.Function(this, `${prefix}FeedHistoryLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'feed_history_processor.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/event-invoked')),
            environment: {
                HISTORY_TABLE: props.history.tableName,
                QUEUE_URL: queue.queueUrl,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.history.grantStreamRead(feedHistory);
        props.metadata.grantReadData(feedHistory);
        queue.grantSendMessages(feedHistory);

        feedHistory.addEventSource(new eventsources.DynamoEventSource(props.history, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 10
        }));

        const feedLikes = new lambda.Function(this, `${prefix}FeedLikesLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'feed_likes_processor.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/event-invoked')),
            environment: {
                LIKES_TABLE: props.likes.tableName,
                QUEUE_URL: queue.queueUrl,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.likes.grantStreamRead(feedLikes);
        props.metadata.grantReadData(feedLikes);
        queue.grantSendMessages(feedLikes);

        feedLikes.addEventSource(new eventsources.DynamoEventSource(props.likes, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 10
        }));

        const feedSubs = new lambda.Function(this, `${prefix}FeedSubsLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'feed_subs_processor.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/event-invoked')),
            environment: {
                // SUBSCRIPTIONS_TABLE: props.history.tableName, TODO: is this bug or not?
                SUBSCRIPTIONS_TABLE: props.subscriptions.tableName,
                QUEUE_URL: queue.queueUrl,
            }
        });

        props.subscriptions.grantStreamRead(feedSubs);
        queue.grantSendMessages(feedSubs);

        feedSubs.addEventSource(new eventsources.DynamoEventSource(props.subscriptions, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 10
        }));

        const feedSync = new lambda.Function(this, `${prefix}FeedSyncLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'feed_sync.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/event-invoked')),
            environment: {
                QUEUE_URL: queue.queueUrl,
                FEED_TABLE: props.feed.tableName
            }
        });

        feedSync.addEventSource(new eventsources.SqsEventSource(queue, {
            batchSize: 5,
            maxBatchingWindow: cdk.Duration.seconds(30),
            reportBatchItemFailures: true
        }));

        queue.grantConsumeMessages(feedSync);
        props.feed.grantReadWriteData(feedSync);

        const getFeed = new lambda.Function(this, `${prefix}GetFeedLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'get_feed.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/metadata-endpoints')),
            environment: {
                FEED_TABLE: props.feed.tableName,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.feed.grantReadData(getFeed);
        props.metadata.grantReadData(getFeed);

        const getFeedIntegration = new HttpLambdaIntegration(
            `${prefix}GetFeed`,
            getFeed
        );
        props.api.addRoutes({
            path: "/get-feed",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: getFeedIntegration,
            authorizer: props.httpAuthorizer,
        });
    }
}

