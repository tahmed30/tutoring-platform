import { EnvironmentConfig } from './types';

export const prodConfig: EnvironmentConfig = {
  envName: 'prod',
  account: process.env.CDK_DEFAULT_ACCOUNT ?? '000000000000',
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  apiDomain: 'api.tutoring.example.com',
  frontendDomain: 'tutoring.example.com',
  auroraMinCapacity: 1,
  auroraMaxCapacity: 16,
  backupRetentionDays: 35,
  multiAz: true,
  apiDesiredCount: 3,
  apiCpu: 1024,
  apiMemoryMiB: 2048,
  enableCognito: false,
  retainData: true,
};
