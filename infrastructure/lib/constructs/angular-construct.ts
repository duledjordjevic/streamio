import { Construct } from "constructs";
import {
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_s3_deployment as s3Deployment,
  DockerImage,
  CfnOutput,
} from "aws-cdk-lib";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface AngularConstructProps {
  /**
   * The configuration needed for building the angular app (defined in angular.json).
   * Probably something like 'production'.
   * This is needed to run "ng build --configuration <buildConfiguration>"
   */
  readonly buildConfiguration: string;

  /**
   * The path to the Angular code (relative to cdk folder).
   * e.g. "./demo-angular-app"
   */
  readonly relativeAngularPath: string;
  readonly stageName?: string;
  readonly appConfig?: { API : string; USER_POOL_ID: string; USER_POOL_CLIENT_ID: string; STAGE: string };
}

export class AngularConstruct extends Construct {  
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: AngularConstructProps) {
    super(scope, id);

    const webAppBucket = new s3.Bucket(this, "WebAppBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const webDistribution = this.createCloudFrontDistribution(webAppBucket);

    this.distributionDomainName = webDistribution.distributionDomainName;

    new CfnOutput(this, 'WebAppDomainName', {
        value: webDistribution.distributionDomainName
    });

    this.createDeployment(props, webAppBucket, webDistribution);
  }

  private createCloudFrontDistribution(webAppBucket: s3.IBucket) {
    return new cloudfront.CloudFrontWebDistribution(
      this,
      "AngularAppWebDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: webAppBucket,
              originAccessIdentity: new cloudfront.OriginAccessIdentity(
                this,
                "OriginAccessIdentityForWebAppBucket"
              ),
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 403,
            errorCachingMinTtl: 60,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
          {
            errorCode: 404,
            errorCachingMinTtl: 60,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );
  }

  private createDeployment(
    props: AngularConstructProps,
    webAppBucket: s3.IBucket,
    webDistribution: cloudfront.CloudFrontWebDistribution
  ) {
    // const configContent = {
    //   API: props.appConfig?.API || '',
    //   USER_POOL_ID: props.appConfig?.USER_POOL_ID || '',
    //   USER_POOL_CLIENT_ID: props.appConfig?.USER_POOL_CLIENT_ID || '',
    //   STAGE: props.appConfig?.STAGE || 'dev',
    // };

    new s3Deployment.BucketDeployment(this, "AngularAppDeployment", {
      destinationBucket: webAppBucket,
      sources: [
        s3Deployment.Source.asset(props.relativeAngularPath, {
          bundling: {
            // is mandatory, but actually not used when "local" is successful
            image: DockerImage.fromRegistry(
              "public.ecr.aws/docker/library/node:lts"
            ),
            local: {
              tryBundle(outputDir) {
                try {
                  spawnSync("npm --version");
                } catch {
                  return false;
                }
                spawnSync(
                  [
                    `cd ${props.relativeAngularPath}`,
                    `npm ci`,
                    `npm run build -- -c ${props.buildConfiguration} --output-path ${outputDir}`,
                  ].join(" && "),
                  {
                    shell: true, // for debugging
                    stdio: "inherit",
                  }
                );
                return true;
              },
            },
          },
        }),
        // s3Deployment.Source.jsonData("config.json", configContent),
      ],
      distribution: webDistribution,
    });
  }
}
