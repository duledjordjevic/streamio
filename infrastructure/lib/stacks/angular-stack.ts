import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AngularConstruct } from "../constructs/angular-construct";

export interface AngularStackProps extends cdk.StackProps {
  readonly stageName?: string;
  readonly appConfig?: { [key: string]: string };
}
export class AngularStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AngularStackProps) {
    super(scope, id, props);

    new AngularConstruct(this, "demo-deployment", {
      buildConfiguration: "production",
      relativeAngularPath: "./client/streamio",
      stageName: props?.stageName,
      appConfig : props?.appConfig
    });
  }
}
