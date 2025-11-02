import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { PipelineStage } from './pipeline';

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
    }
}
