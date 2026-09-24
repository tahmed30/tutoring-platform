# Tutoring Platform

Full-stack tutoring platform: **Angular** frontend, **NestJS** API, **PostgreSQL** (Prisma), deployable to **AWS** via CDK.

Public open-source stack only (npm registry, Angular Material-compatible UI libraries, AWS public services).

## Architecture overview

```
Browser → CloudFront → S3 (Angular SPA)
                ↘
Browser → ALB → ECS Fargate (NestJS) → Aurora Serverless v2 (PostgreSQL)
                              ↓
                    S3 uploads · SNS/SQS · Secrets Manager
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a Mermaid diagram and [docs/API.md](docs/API.md) for API groups (Swagger at `/api/docs`).

## Prerequisites

- Node.js `>=22.22.3`
- Docker (for local Postgres)
- AWS CLI + CDK (for cloud deploy)

## Local setup

```bash
# Install workspaces
npm install

# Postgres
npm run db:up
# copy env
cp .env.example backend/.env   # or use backend/.env.example
# when Prisma scripts are wired:
# npm run db:migrate
# npm run db:seed

# API (http://localhost:3000)
npm run dev:backend

# SPA (http://localhost:4200)
npm run dev:frontend
```

Optional DynamoDB Local for messaging hybrid mode:

```bash
docker compose --profile hybrid up -d dynamodb-local
```

## Demo accounts

Seeded via `backend/prisma` seed (password for all: `Password123!`):

| Role    | Email                 |
|---------|------------------------|
| Admin   | `admin@tutoring.local` |
| Teacher | `teacher@tutoring.local` |
| Parent  | `parent@tutoring.local` |
| Student | `student@tutoring.local` |

Run `npm run db:seed` after migrations.

## Environment variables

Root [`.env.example`](.env.example) summarizes frontend + backend vars.

| Env | Notes |
|-----|--------|
| **dev** | Local Docker Postgres; ACU 0.5–2 if using AWS; Cognito off |
| **staging** | Aurora multi-AZ, ACU 0.5–4; OIDC deploy on push to `main` |
| **prod** | Aurora multi-AZ, ACU 1–16; manual `workflow_dispatch` only |

Config sources of truth for AWS: `infra/config/{dev,staging,prod}.ts`.

## AWS deploy (CDK)

```bash
cd infra
npm install
npx cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
npx cdk synth -c env=dev -c skipDocker=true   # no Docker / creds OK
npx cdk deploy --all -c env=staging
```

Details: [infra/README.md](infra/README.md).

### GitHub Actions secrets / vars

| Name | Used by | Purpose |
|------|---------|---------|
| `CURSOR_API_KEY` | cursor-*.yml | Cursor CLI / agent in CI ([dashboard](https://cursor.com/dashboard/integrations)) |
| `AWS_ROLE_ARN_STAGING` | deploy.yml, cursor-aws-diagnose.yml | OIDC role for staging |
| `AWS_ROLE_ARN_PROD` | deploy.yml | OIDC role for production |
| `AWS_ACCOUNT_ID_STAGING` | deploy.yml | CDK account |
| `AWS_ACCOUNT_ID_PROD` | deploy.yml | CDK account |
| `FRONTEND_BUCKET_STAGING` | deploy.yml | SPA sync target |
| `FRONTEND_BUCKET_PROD` | deploy.yml | SPA sync target |
| `CF_DISTRIBUTION_ID_STAGING` | deploy.yml | Invalidation |
| `CF_DISTRIBUTION_ID_PROD` | deploy.yml | Invalidation |
| `AWS_REGION` (repo var) | deploy.yml | Default `us-east-1` |

Trust GitHub OIDC (`token.actions.githubusercontent.com`) on the IAM roles. CI runs lint/test/build on PR/push; staging deploys on push to `main`; prod is manual.

### Cursor CLI + GitHub Actions + AWS

Pipeline uses the [Cursor CLI in GitHub Actions](https://cursor.com/docs/cli/github-actions) pattern with **restricted autonomy** (agent edits/analyzes; git/AWS mutations stay in deterministic steps):

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | PR / push | Lint, test, build, CDK synth |
| `deploy.yml` | `main` / manual | CDK deploy + S3/CloudFront via AWS OIDC |
| `cursor-ci-fix.yml` | CI **failure** on a PR | Installs Cursor CLI, applies minimal code fixes, pushes `cursor/ci-fix-*` branch, comments on the PR |
| `cursor-aws-diagnose.yml` | Deploy **failure** | OIDC into AWS (read context), Cursor agent writes `docs/ops/last-deploy-diagnosis.md`, uploads artifact + opens an issue |

Project permissions: [`.cursor/cli.json`](.cursor/cli.json) (denies `git` / secret writes; allows `aws` read-style use in diagnose).

```bash
# After the GitHub repo exists:
gh secret set CURSOR_API_KEY --repo tahmed30/tutoring-platform --body "$CURSOR_API_KEY"
```

## Cheaper AWS DB options

| Option | Best for | Pros | Cons |
|--------|----------|------|------|
| **Aurora Serverless v2** (default) | Variable traffic, multi-AZ | Scales ACU, storage auto-grows, HA | Min ACU cost when idle |
| **RDS PostgreSQL burstable** (`db.t4g.micro/small`) | Dev / low fixed cost | Predictable low bill | Vertical scale only; Multi-AZ doubles cost |
| **DynamoDB hybrid** (messages/notifications) | High-churn chat/notifs | On-demand cheap at low volume; single-digit ms | Dual data model; eventual consistency patterns |

Toggle RDS burstable by swapping the commented block in `infra/lib/stacks/database-stack.ts`. Set `USE_DYNAMODB_MESSAGING=true` for the hybrid messaging path (see `.env.example`).

## Repo layout

```
frontend/     Angular SPA
backend/      NestJS + Prisma
infra/        AWS CDK (TypeScript) + terraform outline
docs/         Architecture + API
.github/      ci.yml, deploy.yml, cursor-ci-fix.yml, cursor-aws-diagnose.yml
.cursor/      cli.json (CI agent permissions)
```

## License

UNLICENSED / private unless otherwise stated.
