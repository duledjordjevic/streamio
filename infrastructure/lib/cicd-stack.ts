import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStage } from './pipeline';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class CicdStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new CodePipeline(this, 'Pipeline', {
            pipelineName: 'Pipeline',
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub('duledjordjevic/streamio', 'diplomski'),
                commands: [
                    'cd infrastructure',
                    'npm ci',
                    'npx cdk synth',
                ],
                primaryOutputDirectory: 'infrastructure/cdk.out'
            })
        })

        const notifyTopic = new sns.Topic(this, 'PipelineNotificationsTopic', {
            displayName: 'Pipeline notifications (streamio)',
            topicName: 'streamio-pipeline-notifications',
        });

        notifyTopic.addSubscription(new subs.EmailSubscription('djordjevicdusan24@gmail.com'));

        const notifierFn = new lambda.Function(this, "NotifierFn", {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: "app.handler",
            code: lambda.Code.fromAsset("lambda/event-invoked/cicd-notifier")
        });

        notifyTopic.grantPublish(notifierFn);

        new events.Rule(this, 'CodePipelineFailedRule', {
            description: 'Notify on failed pipeline executions',
            eventPattern: {
                source: ['aws.codepipeline'],
                detailType: ['CodePipeline Pipeline Execution State Change'],
                detail: {
                    state: ['FAILED'],
                    pipeline: ['Pipeline'],              
                },
            },
            targets: [new targets.LambdaFunction(notifierFn)],
        });

        new events.Rule(this, 'CodeBuildFailedRule', {
            description: 'Notify on failed codebuild builds',
            eventPattern: {
                source: ['aws.codebuild'],
                detailType: ['CodeBuild Build State Change'],
                detail: {
                    'build-status': ['FAILED']
                },
            },
            targets: [new targets.LambdaFunction(notifierFn)],
        });

        const devStage = pipeline.addStage(new PipelineStage(this, 'PipelineDevStage', {
            stageName: 'dev'
        }))

        devStage.addPre(new CodeBuildStep('unit tests', {
            commands: [
                'cd infrastructure/test',
                'pip install -r requirements.txt',   
                'export BUCKET_NAME=dev-streamio-movies-bucket',
                'export METADATA_TABLE=StreamioMetadata',
                'pytest -q test_upload_url.py',
            ]
        }));

        // const qaStage = pipeline.addStage(new PipelineStage(this, 'PipelineQAStage', {
        //     stageName: 'qa'
        // }));
        // qaStage.addPre(new cdk.pipelines.ManualApprovalStep('ApproveQA'));

        // const prodStage = pipeline.addStage(new PipelineStage(this, 'PipelineProdStage', {
        //     stageName: 'prod'
        // }));
        // prodStage.addPre(new cdk.pipelines.ManualApprovalStep('ApproveProd'));
       
    }
}
