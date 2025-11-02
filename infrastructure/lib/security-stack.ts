import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import { CognitoPool } from './cognito';

export interface SecurityStackProps extends cdk.StackProps {
    stageName?: string;
}

export class SecurityStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: SecurityStackProps) {
        super(scope, id, props);

        const stageName = props?.stageName ? props.stageName : 'dev';

        new CognitoPool(this, `${stageName}-CognitoPool`, {
            stage: stageName
        });
    }
}
