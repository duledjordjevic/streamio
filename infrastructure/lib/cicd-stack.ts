import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStage } from './pipeline';
import path = require('path');

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

        const devStage = pipeline.addStage(new PipelineStage(this, 'PipelineDevStage', {
            stageName: 'dev'
        }))

        devStage.addPre(new CodeBuildStep('unit tests', {
            commands: [
                'cd infrastructure/test',
                'python3 -m venv .env',
                'source .env/bin/activate',
                'pip install -r requirements.txt',   
                'export BUCKET_NAME=dev-streamio-movies-bucket',
                'export METADATA_TABLE=StreamioMetadata',
                'pytest -q test_upload_url.py',
            ],
            primaryOutputDirectory: 'infrastructure/cdk.out'
        }));

        // const qaStage = pipeline.addStage(new PipelineStage(this, 'PipelineQAStage', {
        //     stageName: 'qa'
        // }));
        // qaStage.addPre(new cdk.pipelines.ManualApprovalStep('ApproveQA'));
        // qaStage.addPre(new CodeBuildStep('unit tests' {
        //     commands: [
        //         'cd infrastructure',
        //         'npm ci',
        //         'npm test'
        //     ]
        // }));
    }
}
