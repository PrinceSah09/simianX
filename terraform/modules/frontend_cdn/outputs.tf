output "bucket_name" {
  description = "Name of the S3 bucket hosting frontend static assets"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket hosting frontend static assets"
  value       = aws_s3_bucket.frontend.arn
}

output "distribution_id" {
  description = "ID of the CloudFront distribution for triggering cache invalidations"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "Public URL of the frontend application via CloudFront CDN"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
