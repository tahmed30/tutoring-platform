# Thin Terraform alternative outline — CDK is the primary IaC.
# Mirror stacks 1:1 if you prefer HCL. Not wired to CI by default.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # backend "s3" { ... }
}

variable "env" {
  type    = string
  default = "dev"
}

# modules/
#   network/     — aws_vpc, subnets, nat, security groups
#   secrets/     — aws_secretsmanager_secret (db + jwt)
#   database/    — aws_rds_cluster (Aurora Serverless v2) OR aws_db_instance (t4g)
#   storage/     — aws_s3_bucket (uploads + frontend), aws_cloudfront_distribution
#   compute/     — aws_ecs_cluster, aws_ecs_service, aws_lb
#   messaging/   — aws_sns_topic, aws_sqs_queue, aws_cloudwatch_event_rule
#   auth/        — aws_cognito_user_pool (optional count)

# Example root composition (pseudo):
#
# module "network" {
#   source = "./modules/network"
#   env    = var.env
# }
#
# module "secrets" {
#   source = "./modules/secrets"
#   env    = var.env
# }
#
# module "database" {
#   source             = "./modules/database"
#   env                = var.env
#   vpc_id             = module.network.vpc_id
#   private_subnet_ids = module.network.private_subnet_ids
#   db_sg_id           = module.network.db_sg_id
#   secret_arn         = module.secrets.db_secret_arn
#   engine             = "aurora-serverless-v2" # or "rds-burstable"
# }

output "placeholder" {
  value = "Prefer CDK under ../ — see infra/README.md"
}
