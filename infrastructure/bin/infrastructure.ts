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

new CicdStack(app, 'CicdStack');

app.synth();
