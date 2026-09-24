#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../config';
import { AuthStack } from '../lib/stacks/auth-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { MessagingStack } from '../lib/stacks/messaging-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();

const envName = (app.node.tryGetContext('env') as string) || 'dev';
const config = getConfig(envName);

/** Skip Docker asset build during CI synth without Docker (set -c skipDocker=true). */
const skipDocker = app.node.tryGetContext('skipDocker') === 'true';

const env: cdk.Environment = {
  account: config.account,
  region: config.region,
};

const tags = {
  Project: 'tutoring-platform',
  Environment: config.envName,
  ManagedBy: 'cdk',
};

function applyTags(stack: cdk.Stack): void {
  Object.entries(tags).forEach(([k, v]) => cdk.Tags.of(stack).add(k, v));
}

const network = new NetworkStack(app, `TutoringNetwork-${config.envName}`, {
  env,
  config,
  description: `Tutoring platform VPC (${config.envName})`,
});
applyTags(network);

const secrets = new SecretsStack(app, `TutoringSecrets-${config.envName}`, {
  env,
  config,
  description: `DB + JWT secrets (${config.envName})`,
});
applyTags(secrets);

const database = new DatabaseStack(app, `TutoringDatabase-${config.envName}`, {
  env,
  config,
  vpc: network.vpc,
  databaseSecurityGroup: network.databaseSecurityGroup,
  dbCredentials: secrets.dbCredentials,
  description: `Aurora Serverless v2 PostgreSQL (${config.envName})`,
});
database.addDependency(network);
database.addDependency(secrets);
applyTags(database);

const storage = new StorageStack(app, `TutoringStorage-${config.envName}`, {
  env,
  config,
  description: `S3 uploads + CloudFront SPA (${config.envName})`,
});
applyTags(storage);

const messaging = new MessagingStack(
  app,
  `TutoringMessaging-${config.envName}`,
  {
    env,
    config,
    description: `SNS/SQS notifications + EventBridge stub (${config.envName})`,
  },
);
applyTags(messaging);

const compute = new ComputeStack(app, `TutoringCompute-${config.envName}`, {
  env,
  config,
  vpc: network.vpc,
  albSecurityGroup: network.albSecurityGroup,
  apiSecurityGroup: network.apiSecurityGroup,
  dbCredentials: secrets.dbCredentials,
  jwtSecret: secrets.jwtSecret,
  jwtRefreshSecret: secrets.jwtRefreshSecret,
  dbHost: database.clusterEndpoint,
  uploadsBucket: storage.uploadsBucket,
  notificationQueue: messaging.notificationsQueue,
  notificationsTopic: messaging.notificationsTopic,
  buildContainerImage: !skipDocker,
  description: `ECS Fargate API + ALB (${config.envName})`,
});
compute.addDependency(network);
compute.addDependency(secrets);
compute.addDependency(database);
compute.addDependency(storage);
compute.addDependency(messaging);
applyTags(compute);

const auth = new AuthStack(app, `TutoringAuth-${config.envName}`, {
  env,
  config,
  description: `Optional Cognito (${config.envName}); primary auth is NestJS JWT`,
});
applyTags(auth);

app.synth();
