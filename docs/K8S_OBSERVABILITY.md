# SimianX — Containerized Kubernetes Observability Guide

> 📖 **Looking for the complete beginner-to-pro interview guide?**
> Check out the **[SRE Interview Masterclass](SRE_INTERVIEW_MASTERCLASS.md)** (550+ lines explaining Docker, Kubernetes, Prometheus, FastAPI, Math behind histograms, and the top 15 interview questions with screenshots).

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Host["Host macOS Environment"]
        Browser["Host Browser<br/><b>http://localhost:30080</b>"]
        PromUI["Prometheus UI<br/><b>http://localhost:30090</b>"]
    end

    subgraph KindCluster["Kind Kubernetes Cluster: simianx"]
        subgraph IngressTier["Edge Ingress & Reverse Proxy"]
            NP_FE["NodePort 30080"]
            NP_PROM["NodePort 30090"]
            FE["simianx-frontend Pod<br/>• React 19 SPA (Vite)<br/>• Nginx API Reverse Proxy"]
        end

        subgraph ServiceTier["Service Routing Layer"]
            BE_SVC["simianx-backend Service<br/>(ClusterIP :8000)"]
        end

        subgraph WorkloadTier["FastAPI Backend Fleet (Auto-scaled 2 - 10 Pods)"]
            Pod1["simianx-backend-pod-1<br/>:8000"]
            Pod2["simianx-backend-pod-2<br/>:8000"]
            PodN["simianx-backend-pod-N<br/>:8000"]
        end

        subgraph ObservabilityTier["Continuous Observability Engine"]
            PromPod["Prometheus Pod<br/>• kubernetes_sd_pods discovery<br/>• 2s scrape frequency"]
        end
    end

    Browser -->|HTTP Traffic| NP_FE
    NP_FE --> FE
    FE -->|proxy_pass /api/v1| BE_SVC

    BE_SVC -->|kube-proxy Load Balance| Pod1
    BE_SVC -->|kube-proxy Load Balance| Pod2
    BE_SVC -->|kube-proxy Load Balance| PodN

    PromPod -.->|Scrapes /metrics| Pod1
    PromPod -.->|Scrapes /metrics| Pod2
    PromPod -.->|Scrapes /metrics| PodN

    PromUI -->|PromQL Query Engine| NP_PROM
    NP_PROM --> PromPod

    classDef host fill:#f8f9fa,stroke:#d1d5db,stroke-width:1.5px,color:#111827;
    classDef cluster fill:#ffffff,stroke:#9ca3af,stroke-width:1.5px,stroke-dasharray: 4 4,color:#111827;
    classDef edge fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e40af;
    classDef svc fill:#f0fdf4,stroke:#22c55e,stroke-width:1.5px,color:#166534;
    classDef pod fill:#faf5ff,stroke:#a855f7,stroke-width:1.5px,color:#6b21a8;
    classDef obs fill:#fff7ed,stroke:#f97316,stroke-width:1.5px,color:#9a3412;

    class Host,Browser,PromUI host;
    class KindCluster cluster;
    class IngressTier,NP_FE,NP_PROM,FE edge;
    class ServiceTier,BE_SVC svc;
    class WorkloadTier,Pod1,Pod2,PodN pod;
    class ObservabilityTier,PromPod obs;
```

---

## Observability Deep-Dive: OpenTelemetry (OTel) & Prometheus Pipeline

Below is the complete end-to-end data pipeline showing how traffic flows from clients and chaos injectors through OpenTelemetry tracing, in-memory sliding-window metrics, Prometheus dynamic Kubernetes scraping, and the React 19 Cockpit:

![SimianX Observability Architecture](screenshots/simianx_observability_architecture.png)

```mermaid
flowchart TD
    subgraph Client["Traffic Sources"]
        User["Browser / HTTP Client"]
        Chaos["Chaos Workload Generator<br/>• Traffic Burst (10-50 RPS)<br/>• Cascading 5xx Faults<br/>• Gaussian Tail Latencies"]
    end

    subgraph FastAPI["SimianX Backend Core (:8000)"]
        Middleware["record_telemetry_middleware<br/>• High-precision time.perf_counter()<br/>• Injects X-Trace-Id header<br/>• Filters admin/polling noise"]
        
        subgraph OTelSub["OpenTelemetry (OTel) SDK"]
            FastAPIInst["FastAPIInstrumentor<br/>(Server Root Spans)"]
            HTTPXInst["HTTPXClientInstrumentor<br/>(Client Child Spans)"]
            Tracer["TracerProvider<br/>Resource: simianx-backend, k8s.pod"]
            
            subgraph DualExporters["Dual Span Processors"]
                BatchProc["BatchSpanProcessor<br/>→ OTLPSpanExporter (Proto/HTTP)<br/>(External Grafana Alloy / Tempo)"]
                SimpleProc["SimpleSpanProcessor<br/>→ BufferSpanExporter<br/>(In-Memory Ring Buffer: 200 traces)"]
            end
        end

        subgraph MetricsSub["Metrics Engine"]
            MemCollector["MetricsCollector (In-Memory)<br/>• 10s Rolling Sliding Window<br/>• P50 / P90 / P95 / P99 Quantiles<br/>• Error Rate & Availability"]
            PromExporter["record_prometheus_request()<br/>• simianx_http_requests_total<br/>• simianx_http_request_duration_seconds"]
        end

        subgraph LogsSub["Live Logs Engine"]
            LogBuffer["append_request_log()<br/>• Microsecond timestamps<br/>• Correlated tr-xxx Trace ID<br/>• Status & Chaos annotations"]
        end
    end

    subgraph Cluster["Kubernetes Infrastructure"]
        Prometheus["Prometheus Server (:9090)<br/>• role: pod dynamic discovery<br/>• Scrapes GET /metrics every 2s"]
    end

    subgraph UI["SimianX Frontend Cockpit (:3000)"]
        Rings["Apple Activity Rings<br/>(RPS, Latency Headroom, Availability)"]
        TracesUI["Trace Waterfall Viewer<br/>(Parent-Child Spans, Offsets, Timeline)"]
        Console["Live Terminal Console<br/>(200 OK, 5xx Chaos Badges, Trace Chips)"]
    end

    User --> Middleware
    Chaos --> Middleware
    Middleware --> FastAPIInst
    FastAPIInst --> Tracer
    Tracer --> BatchProc
    Tracer --> SimpleProc
    Middleware --> MemCollector
    Middleware --> PromExporter
    Middleware --> LogBuffer

    PromExporter -.->|Scraped by| Prometheus
    Prometheus -.->|PromQL Queries| PromClient["PrometheusClient Service<br/>(Resilient Fallback)"]
    PromClient --> Rings
    SimpleProc --> TracesUI
    LogBuffer --> Console

    classDef client fill:#f8fafc,stroke:#94a3b8,stroke-width:1.5px,color:#0f172a;
    classDef mw fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e40af;
    classDef otel fill:#faf5ff,stroke:#a855f7,stroke-width:1.5px,color:#6b21a8;
    classDef metrics fill:#f0fdf4,stroke:#22c55e,stroke-width:1.5px,color:#166534;
    classDef logs fill:#fff7ed,stroke:#f97316,stroke-width:1.5px,color:#9a3412;
    classDef prom fill:#fef3c7,stroke:#f59e0b,stroke-width:1.5px,color:#92400e;
    classDef ui fill:#ffffff,stroke:#64748b,stroke-width:1.5px,color:#0f172a;

    class Client,User,Chaos client;
    class Middleware mw;
    class OTelSub,FastAPIInst,HTTPXInst,Tracer,DualExporters,BatchProc,SimpleProc otel;
    class MetricsSub,MemCollector,PromExporter metrics;
    class LogsSub,LogBuffer logs;
    class Cluster,Prometheus prom;
    class UI,Rings,TracesUI,Console,PromClient ui;
```

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

```mermaid
flowchart LR
    Telemetry["FastAPI Lifespan Loop<br/>(Every 3.0s Evaluation)"] --> Alerter["SlackAlerter Service<br/>• Thread-Safe RLock<br/>• 30s Debounce Cooldown<br/>• Flapping Prevention"]
    
    Alerter --> Conditions{"Bad Condition<br/>Check"}
    
    Conditions -->|Error Rate > 5%| Critical["🚨 Incident: CRITICAL<br/>Color: #dc2626<br/>Slack Block Kit Card"]
    Conditions -->|P95 > 250ms| Warning["⚠️ Incident: WARNING<br/>Color: #f59e0b<br/>Slack Block Kit Card"]
    Conditions -->|Chaos Fault Injection| Warning
    Conditions -->|2x Healthy Cycles| Resolved["✅ Incident: RESOLVED<br/>Color: #16a34a<br/>Auto-Healing Notice"]

    Critical --> Webhook["Slack Incoming Webhook<br/>(POST JSON)"]
    Warning --> Webhook
    Resolved --> Webhook
    Webhook --> Channel["#sre-alerts Channel"]

    classDef trigger fill:#fee2e2,stroke:#ef4444,stroke-width:1.5px,color:#991b1b;
    classDef warn fill:#fef3c7,stroke:#f59e0b,stroke-width:1.5px,color:#92400e;
    classDef ok fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#166534;
    classDef base fill:#f8fafc,stroke:#94a3b8,stroke-width:1.5px,color:#0f172a;

    class Critical trigger;
    class Warning warn;
    class Resolved ok;
    class Telemetry,Alerter,Conditions,Webhook,Channel base;
```

### 1. Monitored Bad Conditions & Thresholds

| Condition | Threshold | Severity | Description |
| :--- | :--- | :--- | :--- |
| **High Error Rate** | `error_rate > 5.0%` | **CRITICAL** (`#dc2626`) | 5xx response surge exceeding the reliability budget |
| **High P95 Latency** | `p95_latency > 250.0ms` | **WARNING** (`#f59e0b`) | Breaches acceptable tail-latency SLA under heavy load |
| **Chaos Fault Injection** | Status `running` & `scenario != traffic_burst` | **WARNING** (`#f59e0b`) | Intentional fault injection experiment active (e.g. database delay) |
| **System Healthy** | Error rate $\le 5\%$ & P95 $\le 250$ms | **RESOLVED** (`#16a34a`) | Requires 2 consecutive cycles to emit auto-recovery notice |

### 2. Flapping Prevention & Anti-Spam Protections

- **Debounce Cooldown (`ALERT_COOLDOWN_SECONDS = 30`)**: Once an alert triggers, repeated incident notifications are throttled so SRE channels are not flooded while troubleshooting.
- **Flapping Suppression (`HEALTHY_CYCLES_TO_RESOLVE = 2`)**: Recovery alerts are only dispatched after two consecutive healthy polling cycles, preventing transient metric dips from firing premature resolution cards.
- **Noise Isolation**: Admin telemetry routes (`/api/v1/alerts`, `/metrics`, `/live-logs`) are excluded from Prometheus counters and latency sliding windows.

### 3. Slack Block Kit Card Format

Incident cards contain rich contextual fields for immediate triage:
- **Title & Badge**: Severity indicator (`🚨 SimianX Incident Alert`, `⚠️ Performance Warning`, `✅ Incident Resolved`)
- **Telemetry Snapshot**: Real-time RPS, P95 latency (ms), Error Rate (%), Active Pod replicas
- **Environment Context**: Kubernetes cluster name, pod identifier, timestamp
- **Action Links**: Direct one-click deep link to SimianX UI Cockpit

### 4. Configuration & API Endpoints

Alerting can be configured via environment variables, Helm values, or directly at runtime via the SimianX Cockpit UI:

#### Environment Variables & Helm
```yaml
# helm/simianx/values.yaml
slackWebhookUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
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
