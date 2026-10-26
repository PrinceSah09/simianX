terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_wafv2_web_acl" "cloudfront_waf" {
  name        = "${var.project_name}-cf-waf-${var.environment}"
  description = "AWS WAFv2 Web ACL with 6 security rules protecting CloudFront dev"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # -----------------------------------------------------------------------------
  # Rule 1: AWS Managed Rules - Common Rule Set (OWASP Top 10)
  # -----------------------------------------------------------------------------
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-common-rules-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # -----------------------------------------------------------------------------
  # Rule 2: AWS Managed Rules - Known Bad Inputs (Log4j, Remote Code Exec, etc.)
  # -----------------------------------------------------------------------------
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-bad-inputs-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # -----------------------------------------------------------------------------
  # Rule 3: AWS Managed Rules - Amazon IP Reputation List (Malicious IPs, botnets)
  # -----------------------------------------------------------------------------
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-ip-reputation-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # -----------------------------------------------------------------------------
  # Rule 4: AWS Managed Rules - Anonymous IP List (Tor nodes, anonymizing proxies)
  # -----------------------------------------------------------------------------
  rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 40

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-anonymous-ip-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # -----------------------------------------------------------------------------
  # Rule 5: AWS Managed Rules - SQL Injection Rule Set (SQLi)
  # -----------------------------------------------------------------------------
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 50

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-sqli-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # -----------------------------------------------------------------------------
  # Rule 6: Custom Rate Limiting Rule (DDoS Mitigation: max N reqs / 5 min per IP)
  # -----------------------------------------------------------------------------
  rule {
    name     = "RateLimitPerIP"
    priority = 60

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-waf-rate-limit-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-cf-waf-metric-${var.environment}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.project_name}-cf-waf-${var.environment}"
    Environment = var.environment
  }
}
