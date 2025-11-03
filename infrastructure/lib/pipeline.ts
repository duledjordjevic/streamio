import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatabaseStack } from "./database-stack";
import { LambdaStack } from "./lambda-stack";
import { SecurityStack } from "./security-stack";
import { FeedStack } from "./stacks/feed-stack";
import { LikesStack } from "./stacks/likes-stack";
import { NotificationStack } from "./stacks/notification-stack";
import { StorageStack } from "./storage-stack";
import { TranscoderStack } from "./transcoder-stack";



export class PipelineStage extends Stage {
    public readonly storage: StorageStack;
    public readonly database: DatabaseStack;

    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props);

        this.storage = new StorageStack(this, 'StorageStack', props);
        this.database = new DatabaseStack(this, 'DatabaseStack', props);

        const securityStack = new SecurityStack(this, 'SecurityStack', props);

        new LambdaStack(this, 'LambdaStack', {
            bucket: this.storage.bucket,
            metadata: this.database.metadata,
            history: this.database.history,
            stageName: props?.stageName,
            userPoolId: securityStack.cognitoPool.userPool.userPoolId,
            userPoolClientId: securityStack.cognitoPool.userPoolClient.userPoolClientId
        })

        const apigateway = new LambdaStack(this, 'ApiGatewayStack', {
            bucket: this.storage.bucket,
            metadata: this.database.metadata,
            history: this.database.history,
            stageName: props?.stageName,
            userPoolId: securityStack.cognitoPool.userPool.userPoolId,
            userPoolClientId: securityStack.cognitoPool.userPoolClient.userPoolClientId
        })
        

        new TranscoderStack(this, 'TranscoderStack', {
            bucketName: this.storage.bucket.bucketName,
            metadata: this.database.metadata,
            stageName: props?.stageName
        });
        // new AngularStack(app, 'AngularStack');

        new NotificationStack(this, 'NotificationStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            metadata: this.database.metadata,
            subscriptions: this.database.subscriptions,
            stageName: props?.stageName
        });

        new LikesStack(this, 'LikesStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            likes: this.database.likes,
            stageName: props?.stageName
        });

        new FeedStack(this, 'FeedStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            metadata: this.database.metadata,
            subscriptions: this.database.subscriptions,
            likes: this.database.likes,
            history: this.database.history,
            feed: this.database.feed,
            stageName: props?.stageName
        });
    }
}
