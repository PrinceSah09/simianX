<p align="center">
  <img src="frontend/public/simianx-logo.png" alt="SimianX Logo" width="420"/>
</p>

# SimianX

**Cloud-Native SRE Resilience & Observability Platform**

[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.31-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![AWS EKS](https://img.shields.io/badge/AWS-EKS-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/eks/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Helm](https://img.shields.io/badge/Helm-v3-0F1689?logo=helm&logoColor=white)](https://helm.sh/)
[![Jenkins](https://img.shields.io/badge/CI-Jenkins-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![ArgoCD](https://img.shields.io/badge/CD-ArgoCD-EF7B4D?logo=argo&logoColor=white)](https://argo-cd.readthedocs.io/)
[![Prometheus](https://img.shields.io/badge/Observability-Prometheus-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)

SimianX is a cloud-native platform designed to simulate concurrent traffic spikes, evaluate SRE Golden Signals, and track real-time latency percentiles (P50, P90, P95, P99) across container fleets. 

Built on AWS EKS with Infrastructure as Code (Terraform), declarative Helm packaging, an automated Jenkins CI pipeline with Trivy container security scans, and continuous GitOps reconciliation using Argo CD.

---

## Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │              CI / CD & GitOps Pipeline                 │
                       └────────────────────────────────────────────────────────┘

     Developer Push
           │
           ▼
  ┌───────────────────────┐
  │   Jenkins Pipeline    │  • Pytest + Ruff linting + TypeScript build
  │     (Jenkinsfile)     │  • Trivy container security scanning
  └───────────┬───────────┘  • Builds and pushes to AWS ECR
              │
              ├───► Pushes Images ─────────► [AWS ECR]
              ▼
  ┌───────────────────────┐
  │ GitOps Repo Promotion │  • Updates image tag in Helm values-dev / values-prod
  │ (Git Commit & Push)   │  • Git serves as single source of truth
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │   Argo CD (In-EKS)    │  • Pulls target environment values
  │      Controller       │  • Executes zero-downtime rolling update & self-heals
  └───────────┬───────────┘
              │
              ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                        AWS EKS Cluster                              │
  │                                                                     │
  │   [CloudFront CDN + AWS WAF] ──► [AWS ALB Ingress]                  │
  │                                         │                           │
  │         ┌───────────────────────────────┴───────────────┐           │
  │         ▼                                               ▼           │
  │   [Frontend Pods]                                 [Backend Pods]    │
  │   (React 19 / Nginx)                           (FastAPI SRE Engine) │
  │                                                         │           │
  │                                                         ▼           │
  │                                                [Prometheus Scraper] │
  │                                                • Scrapes metrics    │
  │                                                • P50/P90/P95/P99    │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

* **High-Density Networking:** Multi-AZ AWS EKS v1.31 provisioned on `/20` private subnets (4,096 IPs per subnet) to eliminate AWS VPC CNI IP-exhaustion during pod autoscaling.
* **Edge Security & CDN:** Multi-Origin CloudFront with S3 Origin Access Control (OAC) for static assets and AWS WAF (6 managed and custom rules for OWASP Top 10 and rate-limiting) protecting upstream Kubernetes ingress.
* **Declarative GitOps:** Jenkins CI packages containers and updates environment-scoped Helm values; in-cluster Argo CD pulls and reconciles state automatically.
* **SRE Telemetry & Percentiles:** Asynchronous FastAPI workload generator calculating real-time P50, P90, P95, and P99 latency quantiles streamed to Prometheus and visualized on Grafana.

---

## Tech Stack

| Layer | Tooling | Description |
|---|---|---|
| **Cloud Infrastructure** | AWS EKS, VPC, ECR | Multi-AZ Kubernetes compute with IAM Roles for Service Accounts (IRSA) |
| **Edge Security** | CloudFront + AWS WAFv2 | Global CDN with rate-limiting and OWASP protection |
| **Infrastructure as Code** | Terraform | Environment-isolated workspaces with S3 remote state locking |
| **Package Management** | Helm v3 | Parameterized charts with environment overrides (`dev`, `prod`) |
| **Continuous Integration** | Jenkins | Automated testing, Trivy CVE scanning, and image publishing |
| **Continuous Delivery** | Argo CD | In-cluster GitOps engine with automated drift detection |
| **Observability** | Prometheus + Grafana | Service metrics, Golden Signals, and latency histograms |
| **Application Services** | FastAPI + React 19 | Python 3.12 async backend & TypeScript dark-mode dashboard |

---

## Quick Start (Local Development)

### Run with Docker Compose
The fastest way to spin up the full stack locally:

```bash
docker compose up --build
```

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Prometheus Metrics:** [http://localhost:8000/metrics](http://localhost:8000/metrics)

---

### Run on Local Kubernetes (Kind)

Deploy the entire platform into a local Kind Kubernetes cluster:

```bash
# 1. Create Kind cluster and deploy via Helm
make kind-up

# 2. Port-forward backend service
kubectl port-forward svc/scalekart-backend 8000:8000 -n simianx

# 3. Teardown when finished
make kind-down
```

---

## Infrastructure Provisioning (AWS)

Prerequisites:
* [AWS CLI](https://aws.amazon.com/cli/) configured with deployment permissions
* [Terraform](https://www.terraform.io/) >= 1.8.0
* [Helm](https://helm.sh/) >= 3.14.0

### Provision DEV Environment
```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### Provision PROD Environment
```bash
cd terraform/environments/prod
terraform init
terraform plan
terraform apply
```

### Deploy Frontend to S3 + CloudFront CDN
```bash
make frontend-deploy-dev
```

---

## Quality Gates & Automation

Run quality checks locally before committing:

```bash
# Run backend tests (pytest), linter (ruff), and frontend build
make test

# Lint Helm charts across local, dev, and prod profiles
make helm-lint

# Validate Terraform formatting and syntax
make tf-validate
```

---

## Repository Structure

```text
├── .github/workflows/       # PR gatekeeper CI workflows (Ruff, Pytest, Helm lint)
├── argocd/                  # GitOps application manifests (dev & prod)
├── backend/                 # FastAPI application, telemetry engine, and unit tests
├── docker-compose.yml       # Local multi-container development environment
├── frontend/                # React 19 + TypeScript dashboard
├── helm/                    # Helm chart with environment-specific values
├── jenkins/                 # Jenkins declarative pipeline & worker Dockerfile
├── kind-config.yaml         # Local multi-node Kind cluster configuration
├── Makefile                 # Common developer and deployment commands
└── terraform/               # Multi-environment AWS infrastructure modules
```

---

## License

This project is licensed under the MIT License.
