module "vpc" {
  source       = "../../modules/vpc"
  vpc_cidr     = var.vpc_cidr
  cluster_name = var.cluster_name
  environment  = var.environment
}

module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

module "eks" {
  source             = "../../modules/eks"
  cluster_name       = var.cluster_name
  cluster_version    = var.cluster_version
  environment        = var.environment
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_types     = var.node_instance_types
  desired_size       = var.node_desired_size
  min_size           = var.node_min_size
  max_size           = var.node_max_size
}

module "waf" {
  source      = "../../modules/waf"
  environment = var.environment
  providers = {
    aws = aws.us_east_1
  }
}

module "frontend_cdn" {
  source               = "../../modules/frontend_cdn"
  environment          = var.environment
  backend_alb_dns_name = var.backend_alb_dns_name
  web_acl_arn          = module.waf.web_acl_arn
}
