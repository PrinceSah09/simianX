variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name (used for Kubernetes discovery tags)"
  type        = string
}

variable "environment" {
  description = "Deployment environment name (dev or prod)"
  type        = string
}
