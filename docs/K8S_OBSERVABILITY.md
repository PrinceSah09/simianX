# SimianX — Containerized Kubernetes Observability Guide

> 📖 **Looking for the complete beginner-to-pro interview guide?**
> Check out the **[SRE Interview Masterclass](SRE_INTERVIEW_MASTERCLASS.md)** (550+ lines explaining Docker, Kubernetes, Prometheus, FastAPI, Math behind histograms, and the top 15 interview questions with screenshots).

---

## Architecture Overview

![SimianX System Architecture](screenshots/simianx_system_architecture.svg)

---

## Observability Deep-Dive: OpenTelemetry (OTel) & Prometheus Pipeline

Below is the complete end-to-end data pipeline showing how traffic flows from clients and chaos injectors through OpenTelemetry tracing, in-memory sliding-window metrics, Prometheus dynamic Kubernetes scraping, and the React 19 Cockpit:

![SimianX Observability Architecture](screenshots/simianx_observability_architecture.png)

### Core Architecture Highlights:

1. **Dual Span Processors**:
   - `BatchSpanProcessor` exports asynchronously via standard Protobuf/HTTP to external collectors (Grafana Alloy / Tempo / Jaeger).
   - `SimpleSpanProcessor` immediately commits finished spans into a thread-safe ring buffer (`InMemoryTraceBuffer`), allowing the UI's Waterfall viewer to query complete traces with zero external dependencies.
2. **Noise Isolation**:
   - Internal dashboard polling and Prometheus `/metrics` scrapes are filtered out in middleware, preventing telemetry pollution.
3. **Resilient PromQL Engine**:
   - When Prometheus is live, the UI queries real PromQL histogram quantiles. If Prometheus is restarting, it automatically falls back to internal sliding-window memory with zero downtime.
4. **W3C Distributed Trace Correlation**:
   - Every HTTP response is stamped with `X-Trace-Id`. Log lines, trace spans, and cURL replays all share identical identifiers (`tr-xxxx`).

---

## 1. Local Development Workflows

### Option A: Standalone Local Development (No Docker/K8s required)
Preserves the rapid code-reload workflow:
```bash
# Terminal 1: Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev # Runs on http://localhost:5173
```

### Option B: Docker Compose Local Development
Runs backend and frontend in containerized bridge network:
```bash
docker compose up --build
# Access UI on http://localhost:3000
# Backend API directly on http://localhost:8000
```

---

## 2. Deploying to Kubernetes (`kind`)

### Step 1: Create the `kind` Cluster with Ingress Port Mappings
```bash
kind create cluster --config kind-config.yaml --name simianx
```
*Port mappings created:*
- `30080 -> 30080`: SimianX Frontend SPA + API Reverse Proxy
- `30090 -> 30090`: Prometheus Server Dashboard & Metrics API

### Step 2: Build and Load Docker Images
```bash
# Build local images
docker build -t simianx-backend:latest backend/
docker build -t simianx-frontend:latest frontend/

# Load into kind cluster node
kind load docker-image simianx-backend:latest --name simianx
kind load docker-image simianx-frontend:latest --name simianx
kind load docker-image prom/prometheus:v2.54.1 --name simianx
```

### Step 3: Deploy via Helm (or `make kind-up`)
```bash
# Deploy all microservices, RBAC, and Prometheus via Helm
helm upgrade --install simianx ./helm/simianx -n simianx --create-namespace
```

### Step 4: Verify Deployment Status
```bash
kubectl get pods -n simianx -o wide
kubectl get deployments -n simianx
```

---

## 3. Prometheus Metric Instrumentation & Discovery

### Pod Annotations for Auto-Discovery
Each `simianx-backend` pod template contains:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8000"
  prometheus.io/path: "/metrics"
```

### Verified Prometheus Target Health
Check active targets scraped by Prometheus:
```bash
curl -s http://localhost:30090/api/v1/targets | python3 -m json.tool
```

### Real Aggregate Percentile Calculation (Constraint 8)
Prometheus aggregates histogram bucket counters across **all** active pods before computing the quantile. We **do not** average pod percentiles:

```promql
# Service-Wide Throughput (RPS)
sum(rate(simianx_http_requests_total[15s]))

# Service-Wide Aggregated P95 Latency (ms)
histogram_quantile(0.95, sum(rate(simianx_http_request_duration_seconds_bucket[15s])) by (le)) * 1000

# Service-Wide Aggregated P50 Latency (ms)
histogram_quantile(0.50, sum(rate(simianx_http_request_duration_seconds_bucket[15s])) by (le)) * 1000

# Service-Wide Aggregated P99 Latency (ms)
histogram_quantile(0.99, sum(rate(simianx_http_request_duration_seconds_bucket[15s])) by (le)) * 1000

# Service-Wide Error Rate (%)
clamp_min(sum(rate(simianx_http_requests_total{status_code=~"5.."}[15s])) / sum(rate(simianx_http_requests_total[15s])), 0) * 100
```

---

## 4. Production-Level Slack Incident Alerting Engine

SimianX includes a native, thread-safe alerting engine (`SlackAlerter`) that continuously monitors telemetry health and dispatches actionable Slack notifications when the system experiences degraded performance or chaos-induced faults.

### Alerting Pipeline Architecture

![SimianX Slack Incident Alerting Pipeline](screenshots/simianx_slack_alerting_pipeline.svg)

### 1. Monitored Bad Conditions & Thresholds

| Condition | Threshold | Severity | Description |
| :--- | :--- | :--- | :--- |
| **High Error Rate** | `error_rate > 5.0%` | **CRITICAL** (`#ff3b30`) | 5xx response surge exceeding the reliability budget |
| **High P95 Latency** | `p95_latency > 250.0ms` | **WARNING** (`#ff9500`) | Breaches acceptable tail-latency SLA under heavy load |
| **Chaos Fault Injection** | Status `running` & `scenario != traffic_burst` | **WARNING** (`#ff9500`) | Intentional fault injection experiment active (e.g. database delay) |
| **System Healthy** | Error rate $\le 5\%$ & P95 $\le 250$ms | **RESOLVED** (`#34c759`) | Requires 2 consecutive cycles to emit auto-recovery notice |

### 2. Flapping Prevention & Anti-Spam Protections

- **Debounce Cooldown (`ALERT_COOLDOWN_SECONDS = 60`)**: Once an alert triggers, repeated incident notifications are throttled so SRE channels are not flooded while troubleshooting.
- **Flapping Suppression (`HEALTHY_CYCLES_TO_RESOLVE = 2`)**: Recovery alerts are only dispatched after two consecutive healthy polling cycles, preventing transient metric dips from firing premature resolution cards.
- **Noise Isolation**: Admin telemetry routes (`/api/v1/alerts`, `/metrics`, `/live-logs`) are excluded from Prometheus counters and latency sliding windows.

### 3. Slack Block Kit Card Format

Incident cards follow clean, Apple-inspired typography with zero noisy emojis:
- **Title**: Severity and scenario header (e.g. `*High Error Rate (25.0%)*`, `*P95 Latency SLA Breached*`, `*Resolved: System Health Restored*`)
- **Telemetry Snapshot**: Real-time Error Rate (%), P95 latency (ms), and Throughput (req/s)
- **Environment Context**: Control plane stamp and UTC timestamp
- **Color Accent**: Subtle left border accent (`#ff3b30` Red for Critical, `#ff9500` Orange for Warning, `#34c759` Green for Resolved, `#0071e3` Blue for Test)

### 4. Configuration & API Endpoints

Alerting can be configured via environment variables, Helm values, or directly at runtime via the SimianX Cockpit UI:

#### Environment Variables & Helm
```yaml
# helm/simianx/values.yaml
slackWebhookUrl: "https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN"
slackChannel: "#sre-alerts"
slackAlertsEnabled: true
```

#### REST API Endpoints
- `GET /api/v1/alerts/status`: Returns current configuration with masked webhook (`https://hooks.slack.com/...****`), active incident status, and firing state.
- `POST /api/v1/alerts/config`: Dynamically updates webhook URL and destination channel without restarting the server.
- `POST /api/v1/alerts/test`: Dispatches a formatted test notification card to verify end-to-end webhook connectivity.

```bash
# Test alert dispatch via cURL:
curl -X POST http://localhost:8000/api/v1/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"}'
```

---

## 5. Manual Horizontal Scaling (2 to 10 Replicas)

### CLI Scaling:
```bash
# Scale to 10 replicas
kubectl scale deployment simianx-backend --replicas=10 -n simianx
kubectl rollout status deployment/simianx-backend -n simianx

# Scale back to 2 replicas
kubectl scale deployment simianx-backend --replicas=2 -n simianx
kubectl rollout status deployment/simianx-backend -n simianx
```

### UI Scaling:
The SimianX dashboard at `http://localhost:30080` contains preset buttons (`2 Pods`, `4 Pods`, `6 Pods`, `8 Pods`, `10 Pods`) that call `POST /api/v1/infrastructure/scale?replicas=N` to dynamically scale the deployment and stream updated pod states.

### Inspecting Infrastructure State via API:
```bash
curl -s http://localhost:30080/api/v1/infrastructure | python3 -m json.tool
```
Returns:
- `cluster_mode: true`
- `desired_replicas`, `ready_replicas`, `available_replicas`
- List of real active pods (`name`, `ip`, `node`, `ready`, `restarts`)
- Prometheus status (`active_targets_count`, `healthy_targets_count`, per-pod scrape latency)

---

## 6. Running Automated Tests

```bash
cd backend
source .venv/bin/activate
ruff check app/ tests/
pytest tests/ -v
```
All 35 unit and integration tests validate:
- Real non-mocked metric computation and histogram quantile math
- Slack incident alerting, auto-recovery resolution cycles, and configuration APIs
- Concurrent experiment prevention
- `/metrics` OpenMetrics format output
- `/api/v1/infrastructure` Kubernetes and Prometheus state extraction

---

## 7. Environment Teardown & Cleanup

### Option A: Remove SimianX Workloads (Keep Cluster)
```bash
kubectl delete namespace simianx
kubectl delete clusterrole simianx-prometheus
kubectl delete clusterrolebinding simianx-prometheus
```

### Option B: Delete Entire `kind` Cluster
```bash
kind delete cluster --name simianx
```
