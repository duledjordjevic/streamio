import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';


export class CicdStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new CodePipeline(this, 'Pipeline', {
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
    }
}
