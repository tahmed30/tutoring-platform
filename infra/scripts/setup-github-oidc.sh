#!/usr/bin/env bash
# Idempotent: GitHub Actions OIDC provider + deploy role for CDK.
# Usage: ./setup-github-oidc.sh [aws-account-id] [github-owner/repo] [role-name]
set -euo pipefail

ACCOUNT_ID="${1:-$(aws sts get-caller-identity --query Account --output text)}"
GITHUB_REPO="${2:-tahmed30/tutoring-platform}"
ROLE_NAME="${3:-GitHubActionsTutoringDeploy}"
OIDC_URL="https://token.actions.githubusercontent.com"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Account:    ${ACCOUNT_ID}"
echo "Repo:       ${GITHUB_REPO}"
echo "Role name:  ${ROLE_NAME}"

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  echo "Creating OIDC provider..."
  aws iam create-open-id-connect-provider \
    --url "${OIDC_URL}" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list \
      6938fd4d98bab03faadb97b34396831e3780aea1 \
      1c58a3a8518e8759bf075b76b750d4f2df264fcd
else
  echo "OIDC provider already exists."
fi

TRUST_FILE="$(mktemp)"
sed -e "s/ACCOUNT_ID/${ACCOUNT_ID}/g" -e "s|GITHUB_REPO|${GITHUB_REPO}|g" \
  "${SCRIPT_DIR}/github-oidc-trust.json" > "${TRUST_FILE}"

if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  echo "Creating role ${ROLE_NAME}..."
  aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document "file://${TRUST_FILE}" \
    --description "GitHub Actions OIDC deploy for ${GITHUB_REPO}"
  aws iam attach-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
else
  echo "Updating trust policy on existing role..."
  aws iam update-assume-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-document "file://${TRUST_FILE}"
fi

rm -f "${TRUST_FILE}"

ROLE_ARN="$(aws iam get-role --role-name "${ROLE_NAME}" --query 'Role.Arn' --output text)"
echo ""
echo "ROLE_ARN=${ROLE_ARN}"
echo "Set GitHub secrets:"
echo "  gh secret set AWS_ROLE_ARN_STAGING --repo ${GITHUB_REPO} --body \"${ROLE_ARN}\""
echo "  gh secret set AWS_ROLE_ARN_PROD --repo ${GITHUB_REPO} --body \"${ROLE_ARN}\""
echo "  gh secret set AWS_ACCOUNT_ID_STAGING --repo ${GITHUB_REPO} --body \"${ACCOUNT_ID}\""
echo "  gh secret set AWS_ACCOUNT_ID_PROD --repo ${GITHUB_REPO} --body \"${ACCOUNT_ID}\""
echo "  gh variable set AWS_REGION --repo ${GITHUB_REPO} --body \"us-east-2\""
