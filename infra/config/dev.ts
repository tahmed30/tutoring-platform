import { EnvironmentConfig } from './types';

export const devConfig: EnvironmentConfig = {
  envName: 'dev',
  account: process.env.CDK_DEFAULT_ACCOUNT ?? '971551576728',
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-2',
  apiDomain: 'api.dev.tutoring.example.com',
  frontendDomain: 'dev.tutoring.example.com',
  // Cheaper floor for local/personal AWS accounts
  auroraMinCapacity: 0.5,
  auroraMaxCapacity: 2,
  backupRetentionDays: 7,
  multiAz: false,
  apiDesiredCount: 1,
  apiCpu: 256,
  apiMemoryMiB: 512,
  enableCognito: false,
  retainData: false,
};
