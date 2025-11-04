import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export interface ConfigStackProps extends cdk.StackProps {
    readonly bucketName: string;
    readonly configObject: any;
    readonly distributionId: string;
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

  }
}
