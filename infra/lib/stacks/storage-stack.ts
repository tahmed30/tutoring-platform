import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../config';

export interface StorageStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  /** Allowed browser origins for S3 CORS (frontend domains + localhost) */
  corsOrigins?: string[];
}

/**
 * S3 for assignment uploads + CloudFront + S3 for Angular SPA.
 */
export class StorageStack extends cdk.Stack {
  public readonly uploadsBucket: s3.Bucket;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomain: string;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { config } = props;
    const prefix = `tutoring-${config.envName}`;
    const removal = config.retainData
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
    const autoDelete = !config.retainData;

    const corsOrigins = props.corsOrigins ?? [
      `https://${config.frontendDomain}`,
      'http://localhost:4200',
    ];

    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: undefined, // let AWS generate; avoid global name collisions
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: config.envName === 'prod',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: corsOrigins,
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'AbortIncompleteMultipart',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: removal,
      autoDeleteObjects: autoDelete,
    });

    // Tag for discoverability (bucket name is auto-generated)
    cdk.Tags.of(this.uploadsBucket).add('Name', `${prefix}-uploads`);
    cdk.Tags.of(this.uploadsBucket).add('Purpose', 'assignment-uploads');

    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: removal,
      autoDeleteObjects: autoDelete,
    });
    cdk.Tags.of(this.frontendBucket).add('Name', `${prefix}-frontend`);

    const oac = new cloudfront.S3OriginAccessControl(this, 'FrontendOac', {
      description: `${prefix} frontend OAC`,
    });

    this.distribution = new cloudfront.Distribution(this, 'FrontendCdn', {
      comment: `${prefix} Angular SPA`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.frontendBucket,
          { originAccessControl: oac },
        ),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      minimumProtocolVersion:
        cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    this.distributionDomain = this.distribution.distributionDomainName;

    // Explicit least-privilege bucket policy for OAC (CDK also wires this;
    // kept explicit for clarity in code reviews).
    this.frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontOAC',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.frontendBucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      }),
    );

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: this.uploadsBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distributionDomain,
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
    });
  }
}
