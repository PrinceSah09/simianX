.PHONY: help test helm-lint tf-validate tf-init-dev tf-plan-dev tf-init-prod tf-plan-prod kind-up kind-down argocd-up docker-build

help: ## Show this help message
	@echo "SimianX Cloud-Native SRE Resilience Platform Makefile"
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

test: ## Run backend tests, linter, and frontend build check
	@echo "==> Running Backend Quality Checks..."
	@if [ -d "backend/.venv" ]; then \
		cd backend && . .venv/bin/activate && pytest tests/ -v && ruff check app/ tests/; \
	elif [ -d ".venv" ]; then \
		. .venv/bin/activate && cd backend && pytest tests/ -v && ruff check app/ tests/; \
	else \
		cd backend && python3 -m pytest tests/ -v && ruff check app/ tests/; \
	fi
	@echo "==> Running Frontend Build Check..."
	cd frontend && npm run build

helm-lint: ## Validate and lint Helm chart across local, dev, and prod profiles
	@echo "==> Linting Helm chart..."
	helm lint ./helm/scalekart
	helm template local ./helm/scalekart > /dev/null
	helm template dev ./helm/scalekart -f ./helm/scalekart/values-dev.yaml > /dev/null
	helm template prod ./helm/scalekart -f ./helm/scalekart/values-prod.yaml > /dev/null
	@echo "✅ Helm chart validation successful across all environments!"

tf-validate: ## Validate Terraform AWS infrastructure code
	@echo "==> Validating Terraform DEV..."
	cd terraform/environments/dev && terraform fmt -check && terraform validate
	@echo "==> Validating Terraform PROD..."
	cd terraform/environments/prod && terraform fmt -check && terraform validate
	@echo "✅ Terraform configurations valid!"

tf-plan-dev: ## Generate Terraform execution plan for DEV environment
	@echo "==> Generating Terraform Plan for DEV..."
	cd terraform/environments/dev && terraform plan

tf-apply-dev: ## Apply Terraform infrastructure for DEV environment
	@echo "==> Applying Terraform for DEV..."
	cd terraform/environments/dev && terraform apply

tf-destroy-dev: ## Destroy Terraform infrastructure for DEV environment
	@echo "==> Destroying Terraform infrastructure for DEV..."
	cd terraform/environments/dev && terraform destroy -auto-approve

tf-plan-prod: ## Generate Terraform execution plan for PROD environment
	@echo "==> Generating Terraform Plan for PROD..."
	cd terraform/environments/prod && terraform plan

tf-destroy-prod: ## Destroy Terraform infrastructure for PROD environment
	@echo "==> Destroying Terraform infrastructure for PROD..."
	cd terraform/environments/prod && terraform destroy -auto-approve

docker-build: ## Build local Docker images
	@echo "==> Building Backend & Frontend Docker images..."
	docker build -t simianx-backend:latest ./backend
	docker build -t simianx-frontend:latest ./frontend

kind-create: ## Create local Kind Kubernetes cluster from kind-config.yaml
	@echo "==> Ensuring Kind cluster 'simianx' exists..."
	@if ! kind get clusters 2>/dev/null | grep -q "^simianx$$"; then \
		kind create cluster --config kind-config.yaml; \
	else \
		echo "Kind cluster 'simianx' already exists."; \
	fi

kind-up: kind-create docker-build ## Deploy SimianX Backend & Prometheus to local Kind cluster via Helm
	@echo "==> Loading backend image into Kind cluster..."
	kind load docker-image simianx-backend:latest --name simianx
	@echo "==> Deploying backend services via Helm..."
	helm upgrade --install simianx ./helm/scalekart -n simianx --create-namespace

kind-down: ## Uninstall Helm release from local Kind cluster
	@echo "==> Tearing down SimianX release..."
	helm uninstall simianx -n simianx || true

kind-destroy: ## Delete local Kind Kubernetes cluster
	@echo "==> Deleting Kind cluster 'simianx'..."
	kind delete cluster --name simianx

argocd-up: ## Install ArgoCD and apply GitOps applications
	@echo "==> Bootstrapping ArgoCD..."
	./argocd/install.sh

frontend-deploy-dev: ## Build and sync Frontend to AWS S3 & CloudFront CDN (Dev)
	@echo "==> Building Frontend for Production..."
	cd frontend && npm ci && npm run build
	@echo "==> Syncing build artifacts to AWS S3..."
	@BUCKET=$$(cd terraform/environments/dev && terraform output -raw frontend_s3_bucket); \
	DIST_ID=$$(cd terraform/environments/dev && terraform output -raw frontend_cloudfront_distribution_id); \
	aws s3 sync frontend/dist/ s3://$$BUCKET --delete; \
	echo "==> Invalidating CloudFront CDN cache..."; \
	aws cloudfront create-invalidation --distribution-id $$DIST_ID --paths "/*"; \
	URL=$$(cd terraform/environments/dev && terraform output -raw frontend_cloudfront_url); \
	echo "✅ Frontend successfully deployed to CloudFront CDN: $$URL"
