#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../lib/storage-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { SecurityStack } from '../lib/security-stack';
import { TranscoderStack } from '../lib/transcoder-stack';
import { AngularStack } from '../lib/stacks/angular-stack';
import { DatabaseStack } from '../lib/database-stack';
import { NotificationStack } from '../lib/stacks/notification-stack';
import { LikesStack } from '../lib/stacks/likes-stack';
import { FeedStack } from '../lib/stacks/feed-stack';
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const storage = new StorageStack(app, 'StorageStack')
const database = new DatabaseStack(app, 'DatabaseStack')

new LambdaStack(app, 'LambdaStack', {
	bucket: storage.bucket,
	metadata: database.metadata,
	history: database.history
})

const apigateway = new LambdaStack(app, 'TestStack', {
	bucket: storage.bucket,
	metadata: database.metadata,
	history: database.history
})

new SecurityStack(app, 'SecurityStack');

new TranscoderStack(app, 'TranscoderStack', {
	bucketName: storage.bucket.bucketName,
	metadata: database.metadata
});
// new AngularStack(app, 'AngularStack');

new NotificationStack(app, 'NotificationStack', {
	api: apigateway.api,
	httpAuthorizer: apigateway.httpAuthorizer,
	metadata: database.metadata,
	subscriptions: database.subscriptions
});

new LikesStack(app, 'LikesStack', {
	api: apigateway.api,
	httpAuthorizer: apigateway.httpAuthorizer,
	likes: database.likes
});

new FeedStack(app, 'FeedStack', {
	api: apigateway.api,
	httpAuthorizer: apigateway.httpAuthorizer,
	metadata: database.metadata,
	subscriptions: database.subscriptions,
	likes: database.likes,
	history: database.history,
	feed: database.feed
});

new CicdStack(app, 'CicdStack');

app.synth();
