import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface AuthStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Optional Cognito User Pool.
 * Primary auth is custom JWT issued by NestJS (`JWT_SECRET`).
 * Enable via `enableCognito: true` in environment config.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool?: cognito.UserPool;
  public readonly userPoolClient?: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring-${config.envName}`;

    if (!config.enableCognito) {
      new cdk.CfnOutput(this, 'CognitoEnabled', { value: 'false' });
      return;
    }

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${prefix}-users`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: config.retainData
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('SpaClient', {
      userPoolClientName: `${prefix}-spa`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://${config.frontendDomain}/auth/callback`,
          'http://localhost:4200/auth/callback',
        ],
        logoutUrls: [
          `https://${config.frontendDomain}/`,
          'http://localhost:4200/',
        ],
      },
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
