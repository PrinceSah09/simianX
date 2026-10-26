variable "environment" {
  description = "Target deployment environment (e.g. dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "scalekart"
}

variable "backend_alb_dns_name" {
  description = "Public DNS name of the backend Application Load Balancer (ALB) for multi-origin routing"
  type        = string
  default     = ""
}

variable "web_acl_arn" {
  description = "ARN of the AWS WAFv2 Web ACL to attach to CloudFront"
  type        = string
  default     = ""
}
