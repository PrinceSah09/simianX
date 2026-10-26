output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "ecr_backend_url" {
  description = "AWS ECR repository URL for ScaleKart Backend (Dev)"
  value       = module.ecr.backend_repository_url
}

output "kubeconfig_command" {
  description = "Command to configure kubectl context for EKS"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "frontend_s3_bucket" {
  description = "S3 bucket name for hosting frontend static assets"
  value       = module.frontend_cdn.bucket_name
}

output "frontend_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend cache invalidation"
  value       = module.frontend_cdn.distribution_id
}

output "frontend_cloudfront_url" {
  description = "Public HTTPS URL for ScaleKart frontend via CloudFront Global CDN"
  value       = module.frontend_cdn.frontend_url
}

output "waf_web_acl_arn" {
  description = "ARN of AWS WAFv2 Web ACL protecting CloudFront"
  value       = module.waf.web_acl_arn
}
