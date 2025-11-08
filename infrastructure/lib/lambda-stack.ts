import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambdaAuthorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import path = require('path');
import { CognitoPool } from './cognito';
import { Cors } from 'aws-cdk-lib/aws-apigateway';

interface LambdaStackProps extends cdk.StackProps {
    bucket: s3.Bucket;
    metadata: dynamodb.TableV2;
    history: dynamodb.TableV2;
    stageName?: string;
    userPoolId?: string;
    userPoolClientId?: string;
    allowOrigins?: string[];
}

export class LambdaStack extends cdk.Stack {

    public readonly httpAuthorizer: lambdaAuthorizers.HttpLambdaAuthorizer;
    public readonly api: apigatewayv2.HttpApi;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        const prefix = props && props.stageName ? `${props.stageName}-` : '';

        const authorizerLayer = new lambda.LayerVersion(this, `${prefix}Authorizer-Layer`, {
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            code: lambda.Code.fromAsset(path.join(__dirname, '../layer-assets', 'authorizer.zip')),
            compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
            description: 'Authorizer aws-jwt-verify node module',
        });

        const authorizerFunction = new lambda.Function(this, `${prefix}AuthorizerFunction`, {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'authorizer.handler',
            timeout: cdk.Duration.seconds(10),
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
            layers: [authorizerLayer],
            environment: {
                USER_POOL_ID: props.userPoolId ?? '',
                CLIENT_ID: props.userPoolClientId ?? ''
            }
        });

        this.api = new apigatewayv2.HttpApi(this, `${prefix}StreamioApi`, {
            apiName: `${prefix}Video Streaming Service`,
            description: 'Service for upload, download and streaming of videos.',
            corsPreflight: {
                allowMethods: [
                    apigatewayv2.CorsHttpMethod.GET,
                    apigatewayv2.CorsHttpMethod.DELETE,
                    apigatewayv2.CorsHttpMethod.PUT,
                    apigatewayv2.CorsHttpMethod.POST,
                    apigatewayv2.CorsHttpMethod.OPTIONS,
                ],
                allowOrigins: props?.allowOrigins ?? ["http://localhost:4200"],
                allowHeaders: ["Content-Type", "Authorization"],
                allowCredentials: true,
                exposeHeaders: ["*"],
            },

        });

        this.httpAuthorizer = new lambdaAuthorizers.HttpLambdaAuthorizer(
            `${prefix}HttpLambdaAuthorizer`,
            authorizerFunction,
            {
                responseTypes: [
                    lambdaAuthorizers.HttpLambdaResponseType.SIMPLE,
                ],
            }
        );

        const uploadURL = new lambda.Function(this, `${prefix}UploadURLLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'upload_url.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presigned-endpoints')),
            environment: {
                BUCKET_NAME: props.bucket.bucketName,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.bucket.grantReadWrite(uploadURL);
        props.metadata.grantWriteData(uploadURL);


        const uploadURLIntegration = new HttpLambdaIntegration(
            `${prefix}GetUploadUrl`,
            uploadURL
        );
        this.api.addRoutes({
            path: "/upload-url",
            methods: [apigatewayv2.HttpMethod.POST],
            integration: uploadURLIntegration,
            authorizer: this.httpAuthorizer,
        });

        const downloadURL = new lambda.Function(this, `${prefix}DownloadURLLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'download_url.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presigned-endpoints')),
            environment: {
                BUCKET_NAME: props.bucket.bucketName,
                HISTORY_TABLE: props.history.tableName
            }
        });

        props.bucket.grantRead(downloadURL);
        props.history.grantWriteData(downloadURL);

        const downloadURLIntegration = new HttpLambdaIntegration(
            `${prefix}DownloadURL`,
            downloadURL
        );
        this.api.addRoutes({
            path: "/download-url",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: downloadURLIntegration,
            authorizer: this.httpAuthorizer,
        });


        const previewURL = new lambda.Function(this, `${prefix}PreviewURLLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'preview_url.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/presigned-endpoints')),
            environment: {
                BUCKET_NAME: props.bucket.bucketName,
                HISTORY_TABLE: props.history.tableName
            }
        });

        props.bucket.grantRead(previewURL);
        props.history.grantWriteData(previewURL);

        const previewURLIntegration = new HttpLambdaIntegration(
            `${prefix}PreviewURL`,
            previewURL
        );
        this.api.addRoutes({
            path: "/preview-url",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: previewURLIntegration,
            authorizer: this.httpAuthorizer,
        });

        const deleteMovie = new lambda.Function(this, `${prefix}DeleteMovieLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'delete_movie.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
            environment: {
                BUCKET_NAME: props.bucket.bucketName,
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.bucket.grantRead(deleteMovie);
        props.bucket.grantDelete(deleteMovie);
        props.metadata.grantReadWriteData(deleteMovie);

        const deleteMovieIntegration = new HttpLambdaIntegration(
            `${prefix}DeleteMovie`,
            deleteMovie
        );
        this.api.addRoutes({
            path: "/delete-movie",
            methods: [apigatewayv2.HttpMethod.DELETE],
            integration: deleteMovieIntegration,
            authorizer: this.httpAuthorizer,
        });

        const getMovie = new lambda.Function(this, `${prefix}GetMovieLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'get_movie.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/metadata-endpoints')),
            environment: {
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.metadata.grantReadData(getMovie);

        const getMovieIntegration = new HttpLambdaIntegration(
            `${prefix}GetMovie`,
            getMovie
        );
        this.api.addRoutes({
            path: "/get-movie",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: getMovieIntegration,
            authorizer: this.httpAuthorizer,
        });

        const queryMovies = new lambda.Function(this, `${prefix}QueryMoviesLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'query_movies.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/metadata-endpoints')),
            environment: {
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.metadata.grantReadData(queryMovies);

        const queryMovieIntegration = new HttpLambdaIntegration(
            `${prefix}GetMovie`,
            queryMovies
        );
        this.api.addRoutes({
            path: "/movies",
            methods: [apigatewayv2.HttpMethod.GET],
            integration: queryMovieIntegration,
            authorizer: this.httpAuthorizer,
        });

        const putMovie = new lambda.Function(this, `${prefix}PutMovieLambda`, {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'put_movie.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/metadata-endpoints')),
            environment: {
                METADATA_TABLE: props.metadata.tableName
            }
        });

        props.metadata.grantWriteData(putMovie);

        const putMovieIntegration = new HttpLambdaIntegration(
            `${prefix}PutMovie`,
            putMovie
        );
        this.api.addRoutes({
            path: "/put-movie",
            methods: [apigatewayv2.HttpMethod.PUT],
            integration: putMovieIntegration,
            authorizer: this.httpAuthorizer,
        });
    }
}
