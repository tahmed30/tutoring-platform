# AWS CDK (TypeScript) for the tutoring platform

## Stacks

| Stack | Purpose |
|-------|---------|
| `TutoringNetwork-{env}` | VPC, public/private subnets, ALB/API/DB security groups |
| `TutoringSecrets-{env}` | Secrets Manager: DB credentials, JWT access + refresh |
| `TutoringDatabase-{env}` | Aurora PostgreSQL Serverless v2 (RDS burstable alternative in code comments) |
| `TutoringStorage-{env}` | S3 uploads (CORS, encryption, block public) + CloudFront SPA |
| `TutoringMessaging-{env}` | SNS topic, SQS queue + DLQ, EventBridge daily reminder stub |
| `TutoringCompute-{env}` | ECS Fargate NestJS behind ALB; least-privilege task/exec roles |
| `TutoringAuth-{env}` | Optional Cognito User Pool (`enableCognito` in config) |

## Prerequisites

- Node.js `>=22.22.3`
- AWS CLI + credentials (or OIDC in CI) for **deploy**
- Docker (for image asset builds on deploy; not required for synth with `skipDocker`)

```bash
cd infra
npm install
npx cdk bootstrap aws://ACCOUNT/REGION   # once per account/region
```

## Commands

```bash
# Compile-check / CloudFormation templates (no AWS account needed with placeholders)
npx cdk synth -c env=dev -c skipDocker=true

# Diff / deploy
npx cdk diff  -c env=staging
npx cdk deploy --all -c env=staging
npx cdk deploy --all -c env=prod --require-approval broadening
```

Environment configs: `config/dev.ts`, `config/staging.ts`, `config/prod.ts`
(domain placeholders, Aurora ACU min/max, desired count, Cognito toggle).

## Compute alternative: Lambda + API Gateway

Default compute is **ECS Fargate + ALB** for long-lived NestJS (WebSockets-friendly,
Prisma connection pooling, predictable cold-start behavior).

Cheaper / event-driven alternative:

1. Package NestJS with `@codegenie/serverless-express` (or `@vendia/serverless-express`).
2. API Gateway HTTP API → Lambda.
3. Use RDS Proxy in front of Aurora/RDS for connection limits.
4. Keep S3/SQS/SNS the same; swap only the compute stack.

Trade-offs: cold starts, 15-minute max duration, trickier Prisma + connection pooling.
Prefer Fargate until traffic is spiky and mostly request/response.

## Secrets

| Secret | Path pattern |
|--------|----------------|
| DB credentials | `tutoring/{env}/db/credentials` |
| JWT access | `tutoring/{env}/jwt/access` |
| JWT refresh | `tutoring/{env}/jwt/refresh` |

SSM Parameter Store (`SecureString`) is a cheaper option for non-rotating JWT secrets;
Secrets Manager is used here for rotation-ready DB credentials.

## Terraform

See `terraform/main.tf` for a module outline only. CDK is the supported path.
