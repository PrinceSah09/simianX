variable "aws_region" {
  description = "AWS region for ScaleKart infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "cluster_name" {
  description = "AWS EKS cluster name"
  type        = string
  default     = "simianx-eks-dev"
}

variable "cluster_version" {
  description = "Kubernetes version for AWS EKS"
  type        = string
  default     = "1.30"
}

variable "vpc_cidr" {
  description = "CIDR block for ScaleKart VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 1
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes for auto-scaling"
  type        = number
  default     = 2
}

variable "backend_alb_dns_name" {
  description = "Public DNS name of the backend ALB to route /api/* requests from CloudFront"
  type        = string
  default     = ""
}
