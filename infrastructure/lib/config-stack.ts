import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export interface ConfigStackProps extends cdk.StackProps {
    readonly bucketName: string;
    readonly configObject: any;
    readonly distributionId: string;
    readonly apiId: string;
    readonly cloudfrontDomain: string;
    readonly stageName: string;
}

export class ConfigStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);

    const putConfig = {
      service: 'S3',
      action: 'putObject',
      parameters: {
        Bucket: props.bucketName,
        Key: 'config.json',
        Body: JSON.stringify(props.configObject),
        ContentType: 'application/json',
        CacheControl: 'no-cache, max-age=0, must-revalidate'
      },
      physicalResourceId: PhysicalResourceId.of(`config-${props.stackName ?? id}`)
    };

    new AwsCustomResource(this, 'PutConfigJson', {
      onCreate: putConfig,
      onUpdate: putConfig,
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          actions: ['s3:PutObject', 's3:PutObjectAcl'],
          resources: [`arn:aws:s3:::${props.bucketName}/*`],
        })
      ])
    });

    const invalidate = {
        service: 'CloudFront',
        action: 'createInvalidation',
        parameters: {
            DistributionId: props.distributionId,
            InvalidationBatch: {
            Paths: {
                Quantity: 1,
                Items: ['/config.json']
            },
            CallerReference: `${Date.now()}`
            }
        },
        physicalResourceId: PhysicalResourceId.of(`invalidate-${props.stackName ?? id}`)
    };

    new AwsCustomResource(this, 'InvalidateConfig', {
        onCreate: invalidate,
        onUpdate: invalidate,
        policy: AwsCustomResourcePolicy.fromStatements([
            new PolicyStatement({
            actions: ['cloudfront:CreateInvalidation'],
            resources: ['*'] 
            })
        ])
    });

    const corsUpdate = new AwsCustomResource(this, 'UpdateApiCors', {
        onCreate: {
            service: 'ApiGatewayV2',
            action: 'updateApi',
            parameters: {
            ApiId: props.apiId, 
            CorsConfiguration: {
                AllowOrigins: [
                `https://${props.cloudfrontDomain}`, 
                ],
                AllowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
                AllowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
                MaxAge: 3600,
                AllowCredentials: false
            }
            },
            physicalResourceId: PhysicalResourceId.of(`update-cors-${props.stageName}`)
        },
        onUpdate: {
            service: 'ApiGatewayV2',
            action: 'updateApi',
            parameters: {
            ApiId: props.apiId, 
            CorsConfiguration: {
                AllowOrigins: [
                `https://${props.cloudfrontDomain}`, 
                ],
                AllowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
                AllowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
                MaxAge: 3600,
                AllowCredentials: false
            }
            },
            physicalResourceId: PhysicalResourceId.of(`update-cors-${props.stageName}`)
        },
        policy: AwsCustomResourcePolicy.fromStatements([
            new PolicyStatement({
            actions: ['apigateway:PATCH','apigateway:UpdateApi','apigateway:Update*','apigateway:GET*'],
            resources: ['*'],
            })
        ])
    });

  }
}
