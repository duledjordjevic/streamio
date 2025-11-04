import { Lazy, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatabaseStack } from "./database-stack";
import { LambdaStack } from "./lambda-stack";
import { SecurityStack } from "./security-stack";
import { FeedStack } from "./stacks/feed-stack";
import { LikesStack } from "./stacks/likes-stack";
import { NotificationStack } from "./stacks/notification-stack";
import { StorageStack } from "./storage-stack";
import { TranscoderStack } from "./transcoder-stack";
import { AngularStack } from "./stacks/angular-stack";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ConfigStack } from "./config-stack";



export class PipelineStage extends Stage {
    public readonly storage: StorageStack;
    public readonly database: DatabaseStack;

    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props);

        this.storage = new StorageStack(this, 'StorageStack', props);
        this.database = new DatabaseStack(this, 'DatabaseStack', props);

        const securityStack = new SecurityStack(this, 'SecurityStack', props);

        const apigateway = new LambdaStack(this, 'ApiGatewayStack', {
            bucket: this.storage.bucket,
            metadata: this.database.metadata,
            history: this.database.history,
            stageName: props?.stageName,
            userPoolId: securityStack.cognitoPool.userPool.userPoolId,
            userPoolClientId: securityStack.cognitoPool.userPoolClient.userPoolClientId,
            allowOrigins: Lazy.list({ produce: () => [
                `https://${angularStack.webDistribution.distributionDomainName}`,
            ] })
        });
        
        const angularStack = new AngularStack(this, 'AngularStack', {
            stageName: props?.stageName,
        });
        angularStack.addDependency(securityStack);
        angularStack.addDependency(apigateway);

        const configObjToken = {
            production: props?.stageName === 'prod',
            stage: props?.stageName ?? 'dev',
            API: apigateway.api.apiEndpoint,   
            USER_POOL_ID: securityStack.cognitoPool.userPool.userPoolId,
            USER_POOL_CLIENT_ID: securityStack.cognitoPool.userPoolClient.userPoolClientId
        };

        const configStack = new ConfigStack(this, 'WebConfigStack', {
            bucketName: angularStack.webAppBucket.bucketName,
            configObject: configObjToken,
            distributionId: angularStack.webDistribution.distributionId
        });

        configStack.addDependency(angularStack);  
        configStack.addDependency(apigateway);     
        configStack.addDependency(securityStack); 

        new TranscoderStack(this, 'TranscoderStack', {
            bucketName: this.storage.bucket.bucketName,
            metadata: this.database.metadata,
            stageName: props?.stageName
        });

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
