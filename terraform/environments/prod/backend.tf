terraform {
  backend "s3" {
    bucket  = "scalekart-terraform-state-838885265032"
    key     = "scalekart/prod/terraform.tfstate"
    region  = "ap-south-1"
    encrypt = true
  }
}
