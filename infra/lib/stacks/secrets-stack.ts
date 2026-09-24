import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface SecretsStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Secrets Manager for DB credentials and NestJS JWT secrets.
 * Prefer Secrets Manager for rotating credentials; SSM Parameter Store
 * (SecureString) is a cheaper alternative for non-rotating JWT secrets.
 */
export class SecretsStack extends cdk.Stack {
  public readonly dbCredentials: secretsmanager.ISecret;
  public readonly jwtSecret: secretsmanager.ISecret;
  public readonly jwtRefreshSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring/${config.envName}`;
    const removal = config.retainData
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    this.dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `${prefix}/db/credentials`,
      description: 'Aurora/RDS master credentials for tutoring platform',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'tutoring' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
      removalPolicy: removal,
    });

    this.jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `${prefix}/jwt/access`,
      description: 'NestJS JWT access token signing secret',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
      removalPolicy: removal,
    });

    this.jwtRefreshSecret = new secretsmanager.Secret(this, 'JwtRefreshSecret', {
      secretName: `${prefix}/jwt/refresh`,
      description: 'NestJS JWT refresh token signing secret',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
      removalPolicy: removal,
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbCredentials.secretArn,
    });
    new cdk.CfnOutput(this, 'JwtSecretArn', {
      value: this.jwtSecret.secretArn,
    });
  }
}
