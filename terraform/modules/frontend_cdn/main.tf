data "aws_caller_identity" "current" {}

locals {
  bucket_name  = "${var.project_name}-frontend-${var.environment}-${data.aws_caller_identity.current.account_id}"
  s3_origin_id = "s3-frontend-${var.environment}"
}

# -----------------------------------------------------------------------------
# 1. S3 Bucket for Static Website Assets
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = local.bucket_name
  force_destroy = true

  tags = {
    Name        = local.bucket_name
    Environment = var.environment
  }
}

# Ownership controls
resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block all public access (100% private bucket, accessible only via CloudFront OAC)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-Side Encryption (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# -----------------------------------------------------------------------------
# 2. CloudFront Origin Access Control (OAC)
# -----------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac-${var.environment}"
  description                       = "OAC for ${var.project_name} frontend static assets (${var.environment})"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -----------------------------------------------------------------------------
# 3. CloudFront Global CDN Distribution
# -----------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront CDN for ${var.project_name} Frontend (${var.environment})"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Lowest cost tier (US, Canada, Europe, Asia/India)
  web_acl_id          = var.web_acl_arn != "" ? var.web_acl_arn : null

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  dynamic "origin" {
    for_each = var.backend_alb_dns_name != "" ? [1] : []
    content {
      domain_name = var.backend_alb_dns_name
      origin_id   = "alb-backend-${var.environment}"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Multi-Origin Dynamic API routing: proxy /api/* directly to EKS ALB
  dynamic "ordered_cache_behavior" {
    for_each = var.backend_alb_dns_name != "" ? [1] : []
    content {
      path_pattern           = "/api/*"
      target_origin_id       = "alb-backend-${var.environment}"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      forwarded_values {
        query_string = true
        headers      = ["Accept", "Authorization", "Content-Type", "Origin", "Referer", "User-Agent"]
        cookies {
          forward = "all"
        }
      }

      min_ttl     = 0
      default_ttl = 0
      max_ttl     = 0
    }
  }

  # SPA Routing Fix: Map 404 to /index.html with HTTP 200 (preserve 403 for AWS WAF blocks)
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.project_name}-frontend-cdn-${var.environment}"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# 4. S3 Bucket Policy (Restricting read & list access to CloudFront OAC only)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}
