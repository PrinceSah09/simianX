variable "project_name" {
  description = "The project name prefix"
  type        = string
  default     = "scalekart"
}

variable "environment" {
  description = "Target environment (dev, prod)"
  type        = string
  default     = "dev"
}

variable "rate_limit" {
  description = "Maximum requests allowed per 5 minutes per IP address"
  type        = number
  default     = 1000
}
