#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  SimianX: Installing ArgoCD on Kubernetes / AWS EKS     "
echo "=========================================================="

# 1. Create argocd namespace if not exists
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# 2. Install official ArgoCD stable release
echo "==> Deploying ArgoCD Operator..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for ArgoCD Server to be ready
echo "==> Waiting for ArgoCD Server to become ready..."
kubectl rollout status deployment/argocd-server -n argocd --timeout=180s

# 4. Deploy SimianX GitOps Applications (Dev & Prod)
echo "==> Deploying SimianX GitOps Applications for Dev and Prod..."
kubectl apply -f "$(dirname "$0")/application-dev.yaml"
kubectl apply -f "$(dirname "$0")/application-prod.yaml"

# 5. Output credentials
echo "=========================================================="
echo "✅ ArgoCD Successfully Installed & SimianX App Deployed!  "
echo "=========================================================="
echo ""
echo "To access the ArgoCD Web UI:"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  URL: https://localhost:8080"
echo "  Username: admin"
echo ""
echo "To get the admin password, run:"
echo '  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo'
echo "=========================================================="
