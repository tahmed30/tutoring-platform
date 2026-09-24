import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface SecretsStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Secrets Manager for NestJS JWT secrets.
 * DB credentials live in DatabaseStack (same stack as Aurora) to avoid
 * the Secrets Manager ↔ RDS attachment dependency cycle across stacks.
 *
 * SSM Parameter Store (SecureString) is a cheaper alternative for
 * non-rotating JWT secrets.
 */
export class SecretsStack extends cdk.Stack {
  public readonly jwtSecret: secretsmanager.ISecret;
  public readonly jwtRefreshSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring/${config.envName}`;
    const removal = config.retainData
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

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

    new cdk.CfnOutput(this, 'JwtSecretArn', {
      value: this.jwtSecret.secretArn,
    });
  }
}
