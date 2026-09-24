import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecrassets from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';
import { EnvironmentConfig } from '../../config';

export interface ComputeStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.ISecurityGroup;
  apiSecurityGroup: ec2.ISecurityGroup;
  dbCredentials: secretsmanager.ISecret;
  jwtSecret: secretsmanager.ISecret;
  jwtRefreshSecret: secretsmanager.ISecret;
  dbHost: string;
  uploadsBucket: s3.IBucket;
  notificationQueue: sqs.IQueue;
  notificationsTopic: sns.ITopic;
  /**
   * When true, build Docker image from ../../backend.
   * Pass -c skipDocker=true for synth without Docker daemon.
   */
  buildContainerImage?: boolean;
}

/**
 * ECS Fargate NestJS API behind an Application Load Balancer.
 *
 * Alternative (not provisioned here): Lambda + API Gateway HTTP API
 * with NestJS serverless adapter — see infra/README.md.
 */
export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { config, vpc } = props;
    const prefix = `tutoring-${config.envName}`;
    const buildImage = props.buildContainerImage !== false;

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${prefix}-cluster`,
      containerInsights: true,
    });

    const taskRole = new iam.Role(this, 'ApiTaskRole', {
      roleName: `${prefix}-api-task`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Least-privilege task role for NestJS API',
    });

    props.uploadsBucket.grantReadWrite(taskRole);
    props.notificationQueue.grantSendMessages(taskRole);
    props.notificationsTopic.grantPublish(taskRole);
    props.dbCredentials.grantRead(taskRole);
    props.jwtSecret.grantRead(taskRole);
    props.jwtRefreshSecret.grantRead(taskRole);

    const executionRole = new iam.Role(this, 'ApiExecutionRole', {
      roleName: `${prefix}-api-exec`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });
    props.dbCredentials.grantRead(executionRole);
    props.jwtSecret.grantRead(executionRole);
    props.jwtRefreshSecret.grantRead(executionRole);

    const logGroup = new logs.LogGroup(this, 'ApiLogs', {
      logGroupName: `/ecs/${prefix}/api`,
      retention:
        config.envName === 'prod'
          ? logs.RetentionDays.ONE_MONTH
          : logs.RetentionDays.ONE_WEEK,
      removalPolicy: config.retainData
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `${prefix}-api`,
      cpu: config.apiCpu,
      memoryLimitMiB: config.apiMemoryMiB,
      taskRole,
      executionRole,
    });

    const image = buildImage
      ? ecs.ContainerImage.fromAsset(
          path.join(__dirname, '..', '..', '..', 'backend'),
          {
            file: 'Dockerfile',
            platform: ecrassets.Platform.LINUX_AMD64,
          },
        )
      : ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:22-alpine');

    const container = taskDefinition.addContainer('Api', {
      containerName: 'api',
      image,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: config.envName === 'prod' ? 'production' : config.envName,
        PORT: '3000',
        API_PREFIX: 'api/v1',
        AWS_REGION: config.region,
        S3_BUCKET: props.uploadsBucket.bucketName,
        NOTIFICATION_QUEUE_URL: props.notificationQueue.queueUrl,
        NOTIFICATIONS_TOPIC_ARN: props.notificationsTopic.topicArn,
        CORS_ORIGIN: `https://${config.frontendDomain}`,
        DB_HOST: props.dbHost,
        DB_PORT: '5432',
        DB_NAME: 'tutoring',
        // Assemble DATABASE_URL in NestJS bootstrap from DB_* + secrets
      },
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(
          props.dbCredentials,
          'username',
        ),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          props.dbCredentials,
          'password',
        ),
        JWT_SECRET: ecs.Secret.fromSecretsManager(props.jwtSecret),
        JWT_REFRESH_SECRET: ecs.Secret.fromSecretsManager(
          props.jwtRefreshSecret,
        ),
      },
    });
    container.addPortMappings({ containerPort: 3000 });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${prefix}-alb`.slice(0, 32),
      securityGroup: props.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const listener = this.loadBalancer.addListener('Http', {
      port: 80,
      open: true,
      // Attach ACM cert + HTTPS listener when domain is ready
    });

    this.service = new ecs.FargateService(this, 'ApiService', {
      cluster: this.cluster,
      serviceName: `${prefix}-api`,
      taskDefinition,
      desiredCount: config.apiDesiredCount,
      securityGroups: [props.apiSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    listener.addTargets('ApiTargets', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      healthCheck: {
        path: '/api/v1/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    this.apiUrl = `http://${this.loadBalancer.loadBalancerDnsName}`;

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, 'ApiBaseUrl', { value: this.apiUrl });
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
    });
  }
}
