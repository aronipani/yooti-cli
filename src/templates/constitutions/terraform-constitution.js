export function terraformConstitution(config) {
  const project = config.projectName || 'myproject'
  return `# Terraform Constitution
# Applies to: all .tf files, tfvars files, backend configs,
#             CI/CD workflows for terraform

## The golden rule
Infrastructure is code. Every rule that applies to application
code (no secrets, type safety, tests, peer review) applies to
Terraform. Infrastructure changes go through the same gates as
application changes.

## File structure — every module must have exactly these files

  main.tf        — resources only, no variables, no outputs
  variables.tf   — all input variables with type and description
  outputs.tf     — all output values with description
  versions.tf    — required_providers block and terraform block only

Optional:
  locals.tf      — local values only (no resources)
  data.tf        — data sources only (no resources)

Never put everything in one file.
Never name a file anything other than the above.

## Module structure for this project

  infra/
    environments/
      dev/
        main.tf          — calls modules, sets environment=dev
        variables.tf
        terraform.tfvars — dev-specific values (committed)
        backend.tf       — S3 backend config for dev state
      prod/
        main.tf          — calls modules, sets environment=prod
        variables.tf
        terraform.tfvars — prod-specific values (committed)
        backend.tf       — S3 backend config for prod state
    modules/
      dynamodb/          — DynamoDB table + GSIs + TTL
      lambda/            — Lambda functions + IAM roles
      api-gateway/       — REST API + stages + throttling
      s3-cloudfront/     — S3 bucket + CloudFront distribution
      ssm/               — SSM Parameter Store entries
      vpc/               — VPC + subnets + security groups
                           (only generated if databases selected)

## Provider and version pinning — mandatory

  terraform {
    required_version = ">= 1.7.0"
    required_providers {
      aws = {
        source  = "hashicorp/aws"
        version = "~> 5.0"
      }
    }
  }

Never use version = "latest" or omit version constraints.
Pin to a minor version range (~>) not an exact patch.

## State backend — mandatory for all environments

  terraform {
    backend "s3" {
      bucket         = "\${project}-terraform-state-\${environment}"
      key            = "\${module}/terraform.tfstate"
      region         = "us-east-1"
      dynamodb_table = "\${project}-terraform-locks"
      encrypt        = true
    }
  }

State bucket and lock table must be created manually before
first apply. Never store state locally or commit state files.
Never commit .terraform/ directory.
Always add to .gitignore:
  .terraform/
  *.tfstate
  *.tfstate.backup
  .terraform.lock.hcl should be committed — it pins provider versions

## Naming convention — mandatory

Pattern: {project}-{environment}-{resource}
Examples:
  ${project}-dev-lambda-ingest
  ${project}-prod-dynamodb-metrics
  ${project}-dev-api-gateway

Use var.project and var.environment everywhere.
Never hardcode project name or environment in resource names.

## Tagging — mandatory on every resource

  default_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = var.repository_url
  }

Apply default_tags in the provider block so all resources
inherit them automatically. Never tag resources individually
unless adding resource-specific tags on top of defaults.

## Variables — rules

Every variable must have:
  type        — always specified, never omitted
  description — one clear sentence
  validation  — for strings that have a fixed set of valid values

Example:
  variable "environment" {
    type        = string
    description = "Deployment environment (dev or prod)"
    validation {
      condition     = contains(["dev", "prod"], var.environment)
      error_message = "environment must be dev or prod"
    }
  }

Never use default = "" for required variables.
Never use type = any.

## Secrets — never in Terraform

Never put secrets, passwords, or API keys in:
  - .tf files
  - .tfvars files
  - terraform.tfvars
  - Any file committed to git

Secrets go in AWS SSM Parameter Store (SecureString) or
AWS Secrets Manager. Reference them in Terraform as data sources:

  data "aws_ssm_parameter" "anthropic_api_key" {
    name            = "/\${var.project}/\${var.environment}/ANTHROPIC_API_KEY"
    with_decryption = true
  }

The SSM parameters themselves must be created manually or via
a separate bootstrap script — not managed by the same Terraform
state as the application infrastructure.

## IAM — least privilege mandatory

Never use:
  - AdministratorAccess
  - arn:aws:iam::aws:policy/PowerUserAccess
  - Action = ["*"]
  - Resource = ["*"] (unless absolutely required and documented)

Every Lambda IAM role must specify exact actions and resources:
  actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"]
  resources = [aws_dynamodb_table.metrics.arn]

Document any Resource = "*" with a comment explaining why it is
required.

## Remote state references between modules

Use terraform_remote_state to reference outputs from other modules:

  data "terraform_remote_state" "dynamodb" {
    backend = "s3"
    config = {
      bucket = "\${var.project}-terraform-state-\${var.environment}"
      key    = "dynamodb/terraform.tfstate"
      region = var.aws_region
    }
  }

Never hardcode ARNs or resource IDs that exist in another module.
Always reference them via remote state or data sources.

## CI/CD — GitHub Actions workflows

Generate two workflows:
  .github/workflows/terraform-plan.yml   — runs on every PR
  .github/workflows/terraform-apply.yml  — runs on merge to main

terraform-plan.yml must:
  - Run terraform init, validate, fmt -check, plan
  - Post plan output as PR comment
  - Never run apply
  - Require AWS credentials from GitHub secrets

terraform-apply.yml must:
  - Run only on merge to main
  - Run terraform init, plan, apply -auto-approve
  - Require manual approval step for prod environment
  - Post apply output to Slack or GitHub (configurable)

## What to escalate

Write an escalation and stop if:
  - A resource requires cross-account access (need architect input)
  - A module dependency creates a circular reference
  - A required secret does not exist in SSM yet
  - The state bucket or lock table does not exist yet
  - Any resource would grant Action=["*"] without documented reason
`;
}
