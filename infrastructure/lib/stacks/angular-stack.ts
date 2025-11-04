import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AngularConstruct } from "../constructs/angular-construct";

export interface AngularStackProps extends cdk.StackProps {
  readonly stageName?: string;
  readonly appConfig?: { API : string; USER_POOL_ID: string; USER_POOL_CLIENT_ID: string; STAGE: string };
}
export class AngularStack extends cdk.Stack {
  public readonly webAppBucket: cdk.aws_s3.Bucket;
  public readonly webDistribution: cdk.aws_cloudfront.CloudFrontWebDistribution;  

  constructor(scope: Construct, id: string, props?: AngularStackProps) {
    super(scope, id, props);

    const construct = new AngularConstruct(this, "demo-deployment", {
      buildConfiguration: "production",
      relativeAngularPath: "./client/streamio",
      stageName: props?.stageName,
      appConfig : props?.appConfig
    });

    this.webAppBucket = construct.webAppBucket;
    this.webDistribution = construct.webDistribution;
  }
}
