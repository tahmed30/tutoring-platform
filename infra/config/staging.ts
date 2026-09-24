import { EnvironmentConfig } from './types';

export const stagingConfig: EnvironmentConfig = {
  envName: 'staging',
  account: process.env.CDK_DEFAULT_ACCOUNT ?? '000000000000',
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  apiDomain: 'api.staging.tutoring.example.com',
  frontendDomain: 'staging.tutoring.example.com',
  auroraMinCapacity: 0.5,
  auroraMaxCapacity: 4,
  backupRetentionDays: 14,
  multiAz: true,
  apiDesiredCount: 2,
  apiCpu: 512,
  apiMemoryMiB: 1024,
  enableCognito: false,
  retainData: false,
};
