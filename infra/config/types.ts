export type EnvironmentName = 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
  /** Logical environment name */
  envName: EnvironmentName;
  /** AWS account ID (placeholder OK for synth without credentials) */
  account: string;
  /** AWS region */
  region: string;
  /** Public API hostname placeholder (Route53 / ACM later) */
  apiDomain: string;
  /** Frontend hostname placeholder */
  frontendDomain: string;
  /** Aurora Serverless v2 min ACU */
  auroraMinCapacity: number;
  /** Aurora Serverless v2 max ACU */
  auroraMaxCapacity: number;
  /** RDS backup retention in days */
  backupRetentionDays: number;
  /** Multi-AZ for Aurora (writer + reader) */
  multiAz: boolean;
  /** ECS desired task count */
  apiDesiredCount: number;
  /** ECS CPU units */
  apiCpu: number;
  /** ECS memory MiB */
  apiMemoryMiB: number;
  /**
   * Optional Cognito User Pool.
   * Primary auth remains custom JWT issued by NestJS; Cognito is an alternate IdP.
   */
  enableCognito: boolean;
  /** Removal policy: destroy ephemeral envs, retain prod data */
  retainData: boolean;
}
