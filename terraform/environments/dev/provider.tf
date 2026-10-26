terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ScaleKart"
      ManagedBy   = "Terraform"
      Environment = "dev"
    }
  }
}

# AWS WAFv2 for CloudFront MUST be created in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "ScaleKart"
      ManagedBy   = "Terraform"
      Environment = "dev"
    }
  }
}
