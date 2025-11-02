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

        this.storage = new StorageStack(this, 'StorageStack');
        this.database = new DatabaseStack(this, 'DatabaseStack');


        new LambdaStack(this, 'LambdaStack', {
            bucket: this.storage.bucket,
            metadata: this.database.metadata,
            history: this.database.history,
            stageName: props?.stageName
        })

        const apigateway = new LambdaStack(this, 'TestStack', {
            bucket: this.storage.bucket,
            metadata: this.database.metadata,
            history: this.database.history
        })

        new SecurityStack(this, 'SecurityStack');

        new TranscoderStack(this, 'TranscoderStack', {
            bucketName: this.storage.bucket.bucketName,
            metadata: this.database.metadata
        });
        // new AngularStack(app, 'AngularStack');

        new NotificationStack(this, 'NotificationStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            metadata: this.database.metadata,
            subscriptions: this.database.subscriptions
        });

        new LikesStack(this, 'LikesStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            likes: this.database.likes
        });

        new FeedStack(this, 'FeedStack', {
            api: apigateway.api,
            httpAuthorizer: apigateway.httpAuthorizer,
            metadata: this.database.metadata,
            subscriptions: this.database.subscriptions,
            likes: this.database.likes,
            history: this.database.history,
            feed: this.database.feed
        });
    }
}
