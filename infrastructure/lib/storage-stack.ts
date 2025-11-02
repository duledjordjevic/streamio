import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface StorageStackProps extends cdk.StackProps {
    stageName?: string;
}

export class StorageStack extends cdk.Stack {

    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: StorageStackProps) {
        super(scope, id, props);

        const prefix = props?.stageName ? `${props.stageName.toLowerCase().replace(/[^a-z0-9-]/g, '')}-` : '';

        this.bucket = new s3.Bucket(this, `${prefix}MoviesBucket`, {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            bucketName: `${prefix}streamio-movies-bucket`,
            versioned: true,
            cors: [
                {
                  allowedOrigins: ['*'], 
                  allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE], 
                  allowedHeaders: ['*'], 
                  maxAge: 3000, 
                }
              ]
        });

    }
}
