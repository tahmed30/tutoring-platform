import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface NetworkStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * VPC with public + private (egress) subnets, NAT, and shared security groups.
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly apiSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring-${config.envName}`;

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-vpc`,
      maxAzs: 2,
      natGateways: config.envName === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-alb-sg`,
      description: 'ALB ingress HTTP/HTTPS',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP',
    );
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS',
    );

    this.apiSecurityGroup = new ec2.SecurityGroup(this, 'ApiSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-api-sg`,
      description: 'ECS Fargate NestJS API',
      allowAllOutbound: true,
    });
    this.apiSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'ALB to API',
    );

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-db-sg`,
      description: 'Aurora / RDS PostgreSQL',
      allowAllOutbound: false,
    });
    this.databaseSecurityGroup.addIngressRule(
      this.apiSecurityGroup,
      ec2.Port.tcp(5432),
      'API to PostgreSQL',
    );

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'ApiSecurityGroupId', {
      value: this.apiSecurityGroup.securityGroupId,
    });
  }
}
