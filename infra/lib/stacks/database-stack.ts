import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface DatabaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.IVpc;
  databaseSecurityGroup: ec2.ISecurityGroup;
  dbCredentials: secretsmanager.ISecret;
}

/**
 * Default: Aurora PostgreSQL Serverless v2.
 *
 * Cheaper alternative (documented, not provisioned by default):
 * - RDS PostgreSQL burstable (db.t4g.micro / db.t4g.small) with
 *   StorageType.GP3 and optional Multi-AZ for staging/prod.
 * Swap by replacing the DatabaseCluster below with DatabaseInstance.
 * See root README "Cheaper AWS DB options" table.
 */
export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly clusterEndpoint: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { config, vpc, databaseSecurityGroup, dbCredentials } = props;
    const prefix = `tutoring-${config.envName}`;
    const removal = config.retainData
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    /*
     * --- RDS burstable alternative (commented; swap for lower fixed cost) ---
     *
     * const instance = new rds.DatabaseInstance(this, 'Postgres', {
     *   engine: rds.DatabaseInstanceEngine.postgres({
     *     version: rds.PostgresEngineVersion.VER_16,
     *   }),
     *   instanceType: ec2.InstanceType.of(
     *     ec2.InstanceClass.T4G,
     *     config.envName === 'prod'
     *       ? ec2.InstanceSize.SMALL
     *       : ec2.InstanceSize.MICRO,
     *   ),
     *   vpc,
     *   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
     *   securityGroups: [databaseSecurityGroup],
     *   credentials: rds.Credentials.fromSecret(dbCredentials),
     *   databaseName: 'tutoring',
     *   multiAz: config.multiAz,
     *   allocatedStorage: 20,
     *   maxAllocatedStorage: 100,
     *   storageType: rds.StorageType.GP3,
     *   backupRetention: cdk.Duration.days(config.backupRetentionDays),
     *   deletionProtection: config.retainData,
     *   removalPolicy: removal,
     * });
     */

    this.cluster = new rds.DatabaseCluster(this, 'AuroraPostgres', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      defaultDatabaseName: 'tutoring',
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        publiclyAccessible: false,
      }),
      readers: config.multiAz
        ? [
            rds.ClusterInstance.serverlessV2('Reader', {
              scaleWithWriter: true,
              publiclyAccessible: false,
            }),
          ]
        : [],
      serverlessV2MinCapacity: config.auroraMinCapacity,
      serverlessV2MaxCapacity: config.auroraMaxCapacity,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [databaseSecurityGroup],
      backup: {
        retention: cdk.Duration.days(config.backupRetentionDays),
      },
      storageEncrypted: true,
      deletionProtection: config.retainData,
      removalPolicy: removal,
      cloudwatchLogsExports: ['postgresql'],
      clusterIdentifier: `${prefix}-aurora-pg`,
    });

    this.clusterEndpoint = this.cluster.clusterEndpoint.hostname;

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.clusterEndpoint,
    });
    new cdk.CfnOutput(this, 'DatabaseName', { value: 'tutoring' });
  }
}
