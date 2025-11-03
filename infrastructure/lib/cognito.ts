import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');

export interface CognitoPoolProps {
    readonly stage: string;
}

export class CognitoPool extends Construct {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    
    constructor(scope: Construct, id: string, props: CognitoPoolProps) {
        super(scope, id);
        
        const applyRoleLambda = new lambda.Function(this, 'ApplyRoleambda', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'apply_role.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'))
        });


        const cognitoPool = new cognito.UserPool(this, 'CognitoPool', {
            userPoolName: `${props.stage}-CognitoPool`,
            selfSignUpEnabled: true,
            signInCaseSensitive: false,
            signInAliases: {
                email: true,
                // phone: true,
            },
            autoVerify: {
                email: true,
                // phone: true,
            },
            userVerification: {
                emailSubject: 'Hello from My Cool App!',
                emailBody: 'Hello, Thanks for registering in My cool app! Verification code is {####}.',
                emailStyle: cognito.VerificationEmailStyle.CODE
            },
            standardAttributes: {
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
                email: {
                    required: true,
                    mutable: true,
                },
                birthdate: {
                    required: true,
                    mutable: true
                },

            },
            customAttributes: {
                company: new cognito.StringAttribute({ mutable: true }),
            },
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const client = cognitoPool.addClient('MyAppClient', {
            userPoolClientName: 'MyAppClient',
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [cognito.OAuthScope.OPENID],
                callbackUrls: [
                    'http://localhost:4200'
                ],
                logoutUrls: [
                    'http://localhost:4200'
                ]
            },
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            accessTokenValidity: Duration.days(1),
            idTokenValidity: Duration.days(1),
            refreshTokenValidity: Duration.days(30),
        });

        this.userPool = cognitoPool;
        this.userPoolClient = client;


        cognitoPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, applyRoleLambda);

        applyRoleLambda.role?.attachInlinePolicy(
            new iam.Policy(this, "userpool-policy", {
                statements: [
                    new iam.PolicyStatement({
                        actions: ["cognito-idp:AdminAddUserToGroup"],
                        resources: [cognitoPool.userPoolArn],
                    }),
                ],
            })
        );

        const basicUserGroup = new cognito.CfnUserPoolGroup(this, 'BasicUserGroup', {
            groupName: 'BasicUser',
            userPoolId: cognitoPool.userPoolId,
        });

        const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
            groupName: 'Admin',
            userPoolId: cognitoPool.userPoolId,
        });
    }
}
