import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

export interface DatabaseStackProps extends cdk.StackProps {
    stageName?: string;
}

export class DatabaseStack extends cdk.Stack {

    public readonly metadata: dynamodb.TableV2;
    public readonly history: dynamodb.TableV2;
    public readonly subscriptions: dynamodb.TableV2;
    public readonly likes: dynamodb.TableV2;
    public readonly feed: dynamodb.TableV2;

    constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
        super(scope, id, props);

        const prefix = props && props.stageName ? `${props.stageName}-` : '';

        this.metadata = new dynamodb.TableV2(this, 'MoviesMetadataTable', {
            tableName: `${prefix}Metadata`,
            partitionKey: { name: 'directory', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'resolution', type: dynamodb.AttributeType.STRING },
            dynamoStream: dynamodb.StreamViewType.NEW_IMAGE,
            globalSecondaryIndexes: [
                {
                    indexName: 'title-index',
                    partitionKey: {
                        name: 'title',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'directory',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                },
                {
                    indexName: 'description-index',
                    partitionKey: {
                        name: 'description',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'directory',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                },
                {
                    indexName: 'actors-index',
                    partitionKey: {
                        name: 'actors',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'directory',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                },
                {
                    indexName: 'directors-index',
                    partitionKey: {
                        name: 'directors',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'directory',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                },
                {
                    indexName: 'genres-index',
                    partitionKey: {
                        name: 'genres',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'directory',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                }

            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.history = new dynamodb.TableV2(this, 'WatchHistoryTable', {
            tableName: `${prefix}WatchHistory`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            dynamoStream: dynamodb.StreamViewType.NEW_IMAGE,
            globalSecondaryIndexes: [
                {
                    indexName: 'movie-index',
                    partitionKey: {
                        name: 'movie',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'userId',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                }
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.subscriptions = new dynamodb.TableV2(this, 'SubscriptionsTable', {
            tableName: `${prefix}Subscriptions`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            globalSecondaryIndexes: [
                {
                    indexName: 'email-index',
                    partitionKey: {
                        name: 'email',
                        type: dynamodb.AttributeType.STRING
                    },
                    sortKey: {
                        name: 'userId',
                        type: dynamodb.AttributeType.STRING
                    },
                    projectionType: dynamodb.ProjectionType.ALL
                }
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.likes = new dynamodb.TableV2(this, 'LikesTable', {
            tableName: `${prefix}Likes`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'directory', type: dynamodb.AttributeType.STRING },
            dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.feed = new dynamodb.TableV2(this, 'FeedTable', {
            tableName: `${prefix}Feed`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'category', type: dynamodb.AttributeType.STRING },
            dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

    }
}
