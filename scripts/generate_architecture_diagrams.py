#!/usr/bin/env python3
"""Generates production-grade, sleek dark-mode SVG architecture diagrams for SimianX."""

import os

SCREENSHOTS_DIR = os.path.abspath("docs/screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def build_system_architecture_svg() -> str:
    """Master End-to-End System, GitOps & Multi-AZ EKS Architecture."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 860" width="100%" height="100%">
  <defs>
    <!-- Dark Gradients & Filters -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c13"/>
      <stop offset="50%" stop-color="#0d101a"/>
      <stop offset="100%" stop-color="#080a10"/>
    </linearGradient>
    <linearGradient id="panelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#121622"/>
      <stop offset="100%" stop-color="#0e111a"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181d2a"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>
    <linearGradient id="innerCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1b2130"/>
      <stop offset="100%" stop-color="#141824"/>
    </linearGradient>

    <!-- Markers -->
    <marker id="arr-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
    </marker>
    <marker id="arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
    <marker id="arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34c759"/>
    </marker>
    <marker id="arr-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b"/>
    </marker>
    <marker id="arr-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7"/>
    </marker>
  </defs>

  <style>
    .title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; letter-spacing: -0.01em; }
    .subtitle { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif; font-size: 12px; font-weight: 500; fill: #64748b; }
    .header { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .node-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .node-desc { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif; font-size: 11px; font-weight: 400; fill: #94a3b8; }
    .node-code { font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace; font-size: 10.5px; fill: #cbd5e1; }
    .tag { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; }
    .edge-label { font-family: "SF Mono", "JetBrains Mono", monospace; font-size: 10px; font-weight: 600; }
  </style>

  <!-- Canvas Background -->
  <rect width="1320" height="860" rx="16" fill="url(#bgGrad)"/>
  <rect x="1" y="1" width="1318" height="858" rx="15" fill="none" stroke="#1f2535" stroke-width="1.5"/>

  <!-- Top Title Bar -->
  <g transform="translate(40, 36)">
    <circle cx="12" cy="12" r="11" fill="#0071e3" fill-opacity="0.18"/>
    <circle cx="12" cy="12" r="5" fill="#0071e3"/>
    <text x="34" y="17" class="title">SimianX · Cloud-Native SRE Resilience &amp; GitOps Architecture</text>
    <text x="34" y="36" class="subtitle">Multi-AZ AWS EKS v1.31 · High-Density /20 Subnets · Jenkins CI &amp; ArgoCD GitOps · OpenTelemetry Tracing &amp; Prometheus Telemetry</text>
  </g>

  <!-- ========================================================================================= -->
  <!-- TIER 1: CONTINUOUS DELIVERY & GITOPS (LEFT)                                                -->
  <!-- ========================================================================================= -->
  <g transform="translate(40, 95)">
    <!-- Container Box -->
    <rect width="360" height="725" rx="14" fill="url(#panelGrad)" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="360" height="38" rx="14" fill="#141824"/>
    <path d="M 0 38 L 360 38" stroke="#222838" stroke-width="1"/>
    <circle cx="20" cy="19" r="4" fill="#8b5cf6"/>
    <text x="34" y="23" class="header" fill="#c084fc">1. Continuous Delivery &amp; GitOps</text>

    <!-- Node 1: Developer Push (y=56..120) -->
    <g transform="translate(20, 56)">
      <rect width="320" height="64" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="64" rx="2" fill="#8b5cf6"/>
      <text x="18" y="26" class="node-title">Developer Git Commit &amp; PR</text>
      <text x="18" y="44" class="node-desc">Feature branch push to GitHub repository</text>
      <text x="246" y="24" class="tag" fill="#a855f7">GIT PUSH</text>
    </g>

    <!-- Node 2: GitHub Actions PR Gatekeeper (y=142..230) -->
    <g transform="translate(20, 142)">
      <rect width="320" height="88" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="88" rx="2" fill="#0071e3"/>
      <text x="18" y="24" class="node-title">GitHub Actions · PR Gatekeeper</text>
      <text x="18" y="44" class="node-code">• Pytest Suite: 35 Unit &amp; Integration Tests</text>
      <text x="18" y="60" class="node-code">• Ruff Python Linter &amp; PEP 8 Quality Gate</text>
      <text x="18" y="76" class="node-code">• Vite React 19 Build &amp; Helm Template Lint</text>
      <text x="246" y="24" class="tag" fill="#38bdf8">CI GATE</text>
    </g>

    <!-- Node 3: Jenkins Enterprise CI (y=252..350) -->
    <g transform="translate(20, 252)">
      <rect width="320" height="98" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="98" rx="2" fill="#f59e0b"/>
      <text x="18" y="24" class="node-title">Enterprise CI Pipeline (Jenkins)</text>
      <text x="18" y="44" class="node-desc">Automated declarative pipeline on PR merge:</text>
      <text x="18" y="62" class="node-code">• Trivy CVE Container Security Scanner</text>
      <text x="18" y="78" class="node-code">• Build Immutable Docker Images (v{BUILD})</text>
      <text x="250" y="24" class="tag" fill="#fb923c">RELEASE</text>
    </g>

    <!-- Node 4: AWS ECR (y=372..446) -->
    <g transform="translate(20, 372)">
      <rect width="320" height="74" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="74" rx="2" fill="#f59e0b"/>
      <text x="18" y="26" class="node-title">AWS ECR · Container Registry</text>
      <text x="18" y="44" class="node-desc">Private encrypted repository (AES-256)</text>
      <text x="18" y="60" class="node-code">simianx-backend:tag · simianx-frontend:tag</text>
      <text x="248" y="24" class="tag" fill="#f59e0b">REGISTRY</text>
    </g>

    <!-- Node 5: GitOps Manifest Repo (y=468..550) -->
    <g transform="translate(20, 468)">
      <rect width="320" height="82" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="82" rx="2" fill="#8b5cf6"/>
      <text x="18" y="26" class="node-title">GitOps Repository (Helm Values)</text>
      <text x="18" y="44" class="node-desc">Automated commit updates image tag in:</text>
      <text x="18" y="62" class="node-code">helm/simianx/values-dev.yaml (or values-prod)</text>
      <text x="246" y="24" class="tag" fill="#c084fc">MANIFEST</text>
    </g>

    <!-- Node 6: ArgoCD Controller (y=572..674) -->
    <g transform="translate(20, 572)">
      <rect width="320" height="102" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="102" rx="2" fill="#10b981"/>
      <text x="18" y="26" class="node-title">ArgoCD · In-Cluster GitOps Engine</text>
      <text x="18" y="46" class="node-desc">Continuous declarative state reconciliation:</text>
      <text x="18" y="64" class="node-code">• Out-of-Sync &amp; Drift Auto-Correction</text>
      <text x="18" y="80" class="node-code">• Zero-Downtime Rolling Update Strategy</text>
      <text x="252" y="24" class="tag" fill="#34c759">GITOPS</text>
    </g>

    <!-- Vertical Connectors inside Tier 1 (Center x = 180) -->
    <path d="M 180 120 L 180 142" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arr-gray)"/>
    <path d="M 180 230 L 180 252" stroke="#38bdf8" stroke-width="1.5" marker-end="url(#arr-blue)"/>
    <path d="M 180 350 L 180 372" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arr-amber)"/>
    <path d="M 180 446 L 180 468" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arr-purple)"/>
    <path d="M 180 550 L 180 572" stroke="#10b981" stroke-width="1.5" marker-end="url(#arr-green)"/>
  </g>

  <!-- ========================================================================================= -->
  <!-- TIER 2: GLOBAL EDGE & SECURE INGRESS (CENTER)                                             -->
  <!-- ========================================================================================= -->
  <g transform="translate(424, 95)">
    <!-- Container Box -->
    <rect width="254" height="490" rx="14" fill="url(#panelGrad)" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="254" height="38" rx="14" fill="#141824"/>
    <path d="M 0 38 L 254 38" stroke="#222838" stroke-width="1"/>
    <circle cx="20" cy="19" r="4" fill="#0071e3"/>
    <text x="34" y="23" class="header" fill="#38bdf8">2. Edge &amp; Ingress</text>

    <!-- Node 1: CloudFront CDN + WAF (y=56..196) -->
    <g transform="translate(16, 56)">
      <rect width="222" height="140" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="140" rx="2" fill="#0071e3"/>
      <text x="14" y="24" class="node-title">AWS CloudFront CDN</text>
      <text x="14" y="42" class="node-desc">+ AWS WAFv2 Web ACL</text>
      <path d="M 14 52 L 208 52" stroke="#232838" stroke-width="1"/>
      <text x="14" y="68" class="node-code">• Rate Limit: 2k req/5min</text>
      <text x="14" y="84" class="node-code">• OWASP Top 10 Rules</text>
      <text x="14" y="100" class="node-code">• Known Bad Inputs Guard</text>
      <text x="14" y="116" class="node-code">• Single-Domain /api Proxy</text>
      <text x="156" y="24" class="tag" fill="#38bdf8">EDGE WAF</text>
    </g>

    <!-- Node 2: S3 Static SPA Bucket (y=216..310) -->
    <g transform="translate(16, 216)">
      <rect width="222" height="94" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="94" rx="2" fill="#f59e0b"/>
      <text x="14" y="24" class="node-title">AWS S3 · Frontend Bucket</text>
      <text x="14" y="42" class="node-desc">Origin Access Control (OAC)</text>
      <text x="14" y="62" class="node-code">• React 19 SPA static dist/</text>
      <text x="14" y="78" class="node-code">• Direct S3 access blocked</text>
      <text x="162" y="24" class="tag" fill="#fb923c">S3 (OAC)</text>
    </g>

    <!-- Node 3: AWS ALB (y=330..460) -->
    <g transform="translate(16, 330)">
      <rect width="222" height="130" rx="10" fill="url(#cardGrad)" stroke="#2a3144" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="130" rx="2" fill="#10b981"/>
      <text x="14" y="24" class="node-title">AWS ALB · Load Balancer</text>
      <text x="14" y="42" class="node-desc">Multi-AZ Public Subnets (/24)</text>
      <path d="M 14 52 L 208 52" stroke="#232838" stroke-width="1"/>
      <text x="14" y="68" class="node-code">• Path: /api/v1/* → API</text>
      <text x="14" y="84" class="node-code">• TargetGroup Health Check</text>
      <text x="14" y="100" class="node-code">• Auto-Discovers NodePorts</text>
      <text x="14" y="116" class="node-code">• SSL/TLS Termination (:443)</text>
      <text x="156" y="24" class="tag" fill="#34c759">ALB INGRESS</text>
    </g>

    <!-- Connectors inside Tier 2 -->
    <!-- CloudFront -> S3 -->
    <path d="M 127 196 L 127 216" stroke="#38bdf8" stroke-width="1.5" marker-end="url(#arr-blue)"/>
    <!-- CloudFront -> ALB -->
    <path d="M 60 196 L 60 330" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arr-blue)"/>
  </g>

  <!-- ========================================================================================= -->
  <!-- TIER 3: AWS EKS MULTI-AZ WORKLOAD & SRE TELEMETRY TIER (RIGHT)                             -->
  <!-- ========================================================================================= -->
  <g transform="translate(702, 95)">
    <!-- Container Box -->
    <rect width="578" height="725" rx="14" fill="url(#panelGrad)" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="578" height="38" rx="14" fill="#141824"/>
    <path d="M 0 38 L 578 38" stroke="#222838" stroke-width="1"/>
    <circle cx="20" cy="19" r="4" fill="#10b981"/>
    <text x="34" y="23" class="header" fill="#34c759">3. AWS EKS Multi-AZ Cluster (ap-south-1) · /20 High-Density Subnets</text>

    <!-- Subgraph 1: Frontend Workload (y=56..150) -->
    <g transform="translate(20, 56)">
      <rect width="538" height="92" rx="10" fill="url(#cardGrad)" stroke="#2b3245" stroke-width="1"/>
      <text x="18" y="24" class="node-title">SimianX Frontend Cockpit Pods (React 19 + Nginx)</text>
      <text x="18" y="42" class="node-desc">High-Performance Apple HIG Dashboard with Zero Layout Shifts</text>
      <g transform="translate(18, 52)">
        <rect width="156" height="26" rx="6" fill="#161a26" stroke="#333b52" stroke-width="1"/>
        <text x="10" y="17" class="node-code">Activity Rings (RPS)</text>
      </g>
      <g transform="translate(188, 52)">
        <rect width="162" height="26" rx="6" fill="#161a26" stroke="#333b52" stroke-width="1"/>
        <text x="10" y="17" class="node-code">OTel Trace Waterfall</text>
      </g>
      <g transform="translate(364, 52)">
        <rect width="156" height="26" rx="6" fill="#161a26" stroke="#333b52" stroke-width="1"/>
        <text x="10" y="17" class="node-code">Live Terminal Logs</text>
      </g>
    </g>

    <!-- Subgraph 2: Kubernetes Service with Session Affinity (y=162..222) -->
    <g transform="translate(20, 162)">
      <rect width="538" height="58" rx="10" fill="url(#cardGrad)" stroke="#2b3245" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="58" rx="2" fill="#0071e3"/>
      <text x="18" y="24" class="node-title">K8s Service: simianx-backend (:8000)</text>
      <text x="18" y="42" class="node-code">sessionAffinity: ClientIP (timeout: 10800s) · Prevents multi-replica race</text>
      <text x="410" y="24" class="tag" fill="#38bdf8">CLIENT-IP STICKY</text>
    </g>

    <!-- Subgraph 3: Backend Pod Fleet (Microservice Core) (y=234..486) -->
    <g transform="translate(20, 234)">
      <rect width="538" height="252" rx="10" fill="url(#cardGrad)" stroke="#2b3245" stroke-width="1"/>
      <text x="18" y="24" class="node-title">SimianX Backend Pod Fleet (FastAPI SRE Engine)</text>
      <text x="18" y="42" class="node-desc">Replicas: 2-10 (Auto-Scaled) · Resource Limits: 500m CPU / 512Mi RAM</text>

      <!-- Internal Box A: Chaos Simulator -->
      <g transform="translate(18, 54)">
        <rect width="242" height="88" rx="8" fill="url(#innerCard)" stroke="#31394e" stroke-width="1"/>
        <text x="12" y="22" class="node-title" font-size="12px">Chaos Workload Engine</text>
        <text x="12" y="40" class="node-code">• Traffic Burst (10-50 RPS)</text>
        <text x="12" y="56" class="node-code">• Injected Latency (P95 SLA)</text>
        <text x="12" y="72" class="node-code">• Cascading 5xx Faults</text>
      </g>

      <!-- Internal Box B: OpenTelemetry SDK -->
      <g transform="translate(278, 54)">
        <rect width="242" height="88" rx="8" fill="url(#innerCard)" stroke="#31394e" stroke-width="1"/>
        <text x="12" y="22" class="node-title" font-size="12px">OpenTelemetry SDK</text>
        <text x="12" y="40" class="node-code">• W3C traceparent Context</text>
        <text x="12" y="56" class="node-code">• 200 Trace Ring Buffer</text>
        <text x="12" y="72" class="node-code">• Parent-Child Span Graph</text>
      </g>

      <!-- Internal Box C: Sliding-Window Metrics -->
      <g transform="translate(18, 150)">
        <rect width="242" height="88" rx="8" fill="url(#innerCard)" stroke="#31394e" stroke-width="1"/>
        <text x="12" y="22" class="node-title" font-size="12px">MetricsCollector (10s Window)</text>
        <text x="12" y="40" class="node-code">• High-precision time.perf_counter</text>
        <text x="12" y="56" class="node-code">• P50, P90, P95, P99 Quantiles</text>
        <text x="12" y="72" class="node-code">• Window Error Rate &amp; RPS</text>
      </g>

      <!-- Internal Box D: SlackAlerter Background Engine -->
      <g transform="translate(278, 150)">
        <rect width="242" height="88" rx="8" fill="url(#innerCard)" stroke="#31394e" stroke-width="1"/>
        <text x="12" y="22" class="node-title" font-size="12px">SlackAlerter (Lifespan Loop)</text>
        <text x="12" y="40" class="node-code">• Thread-Safe RLock State</text>
        <text x="12" y="56" class="node-code">• 3.0s Continuous Evaluation</text>
        <text x="12" y="72" class="node-code">• Anti-Flapping Auto-Recovery</text>
      </g>
    </g>

    <!-- Subgraph 4: Dual Observability Tier (Bottom Row, y=500..705) -->
    <!-- Left: Prometheus TSDB -->
    <g transform="translate(20, 500)">
      <rect width="260" height="205" rx="10" fill="url(#cardGrad)" stroke="#2b3245" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="205" rx="2" fill="#f59e0b"/>
      <text x="16" y="24" class="node-title">Prometheus TSDB (:9090)</text>
      <text x="16" y="42" class="node-desc">In-Cluster TSDB with Pod Discovery</text>
      <path d="M 16 52 L 244 52" stroke="#232838" stroke-width="1"/>
      <text x="16" y="70" class="node-code">• Scrapes GET /metrics (2s loop)</text>
      <text x="16" y="88" class="node-code">• histogram_quantile(0.95, ...)</text>
      <text x="16" y="106" class="node-code">• Dynamic Pod Annotation Scrape</text>
      <text x="16" y="124" class="node-code">• Dual-layer Client Fallback</text>
      <text x="16" y="142" class="node-code">• Real-time PromQL API Provider</text>
      <text x="16" y="160" class="node-code">• Zero External Agent Overhead</text>
      <text x="178" y="24" class="tag" fill="#f59e0b">PROMETHEUS</text>
    </g>

    <!-- Right: Slack Incident Response -->
    <g transform="translate(298, 500)">
      <rect width="260" height="205" rx="10" fill="url(#cardGrad)" stroke="#2b3245" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="205" rx="2" fill="#8b5cf6"/>
      <text x="16" y="24" class="node-title">Slack Incident Alerts</text>
      <text x="16" y="42" class="node-desc">#sre-alerts Channel Webhook</text>
      <path d="M 16 52 L 244 52" stroke="#232838" stroke-width="1"/>
      <text x="16" y="70" class="node-code">• Critical: Err Rate &gt; 5.0%</text>
      <text x="16" y="88" class="node-code">• Warning: P95 Latency &gt; 250ms</text>
      <text x="16" y="106" class="node-code">• 60-second Debounce Cooldown</text>
      <text x="16" y="124" class="node-code">• 2-Cycle Flapping Auto-Resolution</text>
      <text x="16" y="142" class="node-code">• Rich Block Kit Formatting</text>
      <text x="16" y="160" class="node-code">• Microsecond Incident Timestamps</text>
      <text x="190" y="24" class="tag" fill="#c084fc">SLACK SRE</text>
    </g>
  </g>

  <!-- ========================================================================================= -->
  <!-- CROSS-TIER CONNECTORS & LABELS                                                             -->
  <!-- ========================================================================================= -->

  <!-- ALB Ingress (Tier 2) -> K8s Service / Frontend (Tier 3) -->
  <path d="M 646 450 L 702 450" stroke="#34c759" stroke-width="1.5" marker-end="url(#arr-green)"/>
  <rect x="654" y="438" width="40" height="20" rx="4" fill="#10131d" stroke="#243046" stroke-width="1"/>
  <text x="659" y="452" class="edge-label" fill="#34c759">ROUTE</text>

  <!-- ArgoCD (Tier 1) -> Kubernetes Cluster (Tier 3) Reconciliation -->
  <!-- Clean horizontal route beneath Tier 2 (y = 718) -->
  <path d="M 400 718 L 702 718" stroke="#10b981" stroke-width="1.8" stroke-dasharray="4,4" marker-end="url(#arr-green)"/>
  <rect x="470" y="706" width="180" height="24" rx="5" fill="#0d1017" stroke="#1e2c22" stroke-width="1.2"/>
  <text x="478" y="722" class="edge-label" fill="#34c759">GitOps Reconcile &amp; Auto-Heal</text>

  <!-- Backend Pods (Tier 3) -> Prometheus (Tier 3) Scrape Loop -->
  <path d="M 850 486 L 850 500" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arr-amber)"/>

  <!-- SlackAlerter (Tier 3) -> Slack Alerts Box -->
  <path d="M 1120 486 L 1120 500" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arr-purple)"/>

</svg>
"""


def build_push_vs_pull_gitops_svg() -> str:
    """Push vs Pull GitOps Comparison Diagram (Zero-Trust vs High-Risk)."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 640" width="100%" height="100%">
  <defs>
    <linearGradient id="bgPVP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="badGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#241418"/>
      <stop offset="100%" stop-color="#180e12"/>
    </linearGradient>
    <linearGradient id="goodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f241c"/>
      <stop offset="100%" stop-color="#0b1813"/>
    </linearGradient>
    <linearGradient id="pvpCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181c28"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>

    <marker id="pvp-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e"/>
    </marker>
    <marker id="pvp-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981"/>
    </marker>
  </defs>

  <style>
    .pvp-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .pvp-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .pvp-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .pvp-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .pvp-desc { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; fill: #94a3b8; }
    .pvp-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .pvp-badge { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; }
  </style>

  <rect width="1200" height="640" rx="16" fill="url(#bgPVP)"/>
  <rect x="1" y="1" width="1198" height="638" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="pvp-title">GitOps Architectural Evolution: Legacy Push Model vs Zero-Trust Pull Model</text>
    <text x="0" y="36" class="pvp-sub">Eliminating Cluster Admin Credential Exposure and Inbound Firewall Holes in Kubernetes Production Deployments</text>
  </g>

  <!-- COLUMN 1: LEGACY PUSH MODEL (LEFT) -->
  <g transform="translate(40, 85)">
    <rect width="530" height="515" rx="14" fill="url(#badGrad)" stroke="#521d27" stroke-width="1.5"/>
    <rect x="0" y="0" width="530" height="40" rx="14" fill="#2d1319"/>
    <circle cx="20" cy="20" r="5" fill="#f43f5e"/>
    <text x="34" y="24" class="pvp-header" fill="#fb7185">Legacy Push Model (High Security Risk)</text>
    <text x="400" y="25" class="pvp-badge" fill="#f43f5e">NOT RECOMMENDED</text>

    <!-- Developer Commit -->
    <g transform="translate(24, 60)">
      <rect width="482" height="60" rx="8" fill="url(#pvpCard)" stroke="#3a1b24" stroke-width="1"/>
      <text x="16" y="24" class="pvp-node-title">1. Developer Pushes Code Commit</text>
      <text x="16" y="42" class="pvp-desc">Direct commit or PR merge triggers external CI</text>
    </g>

    <!-- External CI Server (Jenkins / GitLab) -->
    <g transform="translate(24, 150)">
      <rect width="482" height="100" rx="8" fill="url(#pvpCard)" stroke="#521d27" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="100" rx="2" fill="#f43f5e"/>
      <text x="16" y="24" class="pvp-node-title">2. External CI Server (e.g. Jenkins Runner)</text>
      <text x="16" y="44" class="pvp-code">• Holds HIGHLY SENSITIVE cluster admin kubeconfig</text>
      <text x="16" y="60" class="pvp-code">• Runs `kubectl apply` directly into cluster</text>
      <text x="16" y="78" class="pvp-code">• If CI runner is compromised → ENTIRE CLUSTER COMPROMISED</text>
      <text x="360" y="24" class="pvp-badge" fill="#fb7185">CREDENTIAL RISK</text>
    </g>

    <!-- Inbound Firewall Hole Arrow -->
    <path d="M 265 250 L 265 315" stroke="#f43f5e" stroke-width="2" marker-end="url(#pvp-red)"/>
    <rect x="155" y="272" width="220" height="22" rx="4" fill="#301117" stroke="#661f2b" stroke-width="1"/>
    <text x="163" y="287" class="pvp-code" fill="#fca5a5">Inbound Firewall Port 6443 Open</text>

    <!-- Exposed Kubernetes Cluster -->
    <g transform="translate(24, 315)">
      <rect width="482" height="110" rx="8" fill="url(#pvpCard)" stroke="#521d27" stroke-width="1"/>
      <text x="16" y="24" class="pvp-node-title">3. Target Kubernetes Cluster</text>
      <text x="16" y="44" class="pvp-code">• Inbound firewall hole required from external CI IP</text>
      <text x="16" y="60" class="pvp-code">• Manual kubectl changes cause silent configuration drift</text>
      <text x="16" y="76" class="pvp-code">• Zero auditability of who applied what ad-hoc changes</text>
      <text x="16" y="92" class="pvp-code">• CI has no auto-healing when pods or manifests drift</text>
    </g>

    <!-- Bottom Vulnerability Box -->
    <g transform="translate(24, 442)">
      <rect width="482" height="50" rx="8" fill="#1f0f13" stroke="#481822" stroke-width="1"/>
      <text x="16" y="22" class="pvp-code" fill="#f43f5e">CRITICAL VULNERABILITY: Lateral attack vector</text>
      <text x="16" y="38" class="pvp-desc">Compromising a single CI build job yields root access to production workloads.</text>
    </g>
  </g>

  <!-- COLUMN 2: SIMIANX MODERN GITOPS PULL MODEL (RIGHT) -->
  <g transform="translate(630, 85)">
    <rect width="530" height="515" rx="14" fill="url(#goodGrad)" stroke="#1a5338" stroke-width="1.5"/>
    <rect x="0" y="0" width="530" height="40" rx="14" fill="#0f2b1d"/>
    <circle cx="20" cy="20" r="5" fill="#10b981"/>
    <text x="34" y="24" class="pvp-header" fill="#34c759">SimianX GitOps Pull Model (Zero-Trust)</text>
    <text x="400" y="25" class="pvp-badge" fill="#34c759">ENTERPRISE GOLD</text>

    <!-- Step 1: Git Manifest Repo -->
    <g transform="translate(24, 60)">
      <rect width="482" height="64" rx="8" fill="url(#pvpCard)" stroke="#1a5338" stroke-width="1"/>
      <text x="16" y="24" class="pvp-node-title">1. Git Repository (Single Source of Truth)</text>
      <text x="16" y="44" class="pvp-code">• Helm values-dev.yaml / values-prod.yaml</text>
      <text x="360" y="24" class="pvp-badge" fill="#34c759">AUDIT LOG</text>
    </g>

    <!-- Step 2: External CI Only Updates Git -->
    <g transform="translate(24, 146)">
      <rect width="482" height="80" rx="8" fill="url(#pvpCard)" stroke="#1a5338" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="80" rx="2" fill="#10b981"/>
      <text x="16" y="24" class="pvp-node-title">2. Jenkins CI Server (Zero Cluster Secrets)</text>
      <text x="16" y="44" class="pvp-code">• Trivy CVE Scan + Docker Build &amp; Push to AWS ECR</text>
      <text x="16" y="60" class="pvp-code">• ONLY has write access to Git repository (updates image tag)</text>
      <text x="330" y="24" class="pvp-badge" fill="#34c759">NO KUBECONFIG</text>
    </g>

    <!-- Outbound Pull Arrow -->
    <path d="M 265 315 L 265 240" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#pvp-green)"/>
    <rect x="145" y="265" width="240" height="22" rx="4" fill="#0c1f17" stroke="#1a5338" stroke-width="1"/>
    <text x="153" y="280" class="pvp-code" fill="#6ee7b7">Outbound Polling (Zero Inbound Ports)</text>

    <!-- Step 3: In-Cluster ArgoCD Controller -->
    <g transform="translate(24, 315)">
      <rect width="482" height="110" rx="8" fill="url(#pvpCard)" stroke="#1a5338" stroke-width="1"/>
      <text x="16" y="24" class="pvp-node-title">3. ArgoCD Controller (Runs INSIDE Private EKS)</text>
      <text x="16" y="44" class="pvp-code">• 100% Private EKS Cluster: ZERO inbound firewall holes</text>
      <text x="16" y="60" class="pvp-code">• Controller pulls state outward from Git over HTTPS</text>
      <text x="16" y="76" class="pvp-code">• Automated Drift Detection: reverts unauthorized manual kubectl changes</text>
      <text x="16" y="92" class="pvp-code">• Uses short-lived In-Cluster ServiceAccount tokens</text>
    </g>

    <!-- Bottom Security Benefits Box -->
    <g transform="translate(24, 442)">
      <rect width="482" height="50" rx="8" fill="#0a1a12" stroke="#1a5338" stroke-width="1"/>
      <text x="16" y="22" class="pvp-code" fill="#34c759">ZERO-TRUST SECURITY: Complete blast-radius isolation</text>
      <text x="16" y="38" class="pvp-desc">Even if Jenkins runner is fully compromised, attacker CANNOT compromise EKS.</text>
    </g>
  </g>
</svg>
"""


def build_gitops_pipeline_svg() -> str:
    """5-Pipeline Modular GitOps & Enterprise Release Flow."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 690" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#11141f"/>
    </linearGradient>
    <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#161a26"/>
      <stop offset="100%" stop-color="#11131c"/>
    </linearGradient>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
    </marker>
    <marker id="arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
    <marker id="arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34c759"/>
    </marker>
  </defs>

  <style>
    .p-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .p-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .p-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .p-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .p-node-desc { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; fill: #94a3b8; }
    .p-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .p-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  </style>

  <rect width="1200" height="690" rx="16" fill="url(#bgGrad2)"/>
  <rect x="1" y="1" width="1198" height="688" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="p-title">SimianX · 5-Pipeline Modular Delivery Architecture</text>
    <text x="0" y="36" class="p-sub">Independent CI/CD Lifecycle Isolation: PR Quality Gates, Terraform IaC, Jenkins Releases, S3/CloudFront Edge, and ArgoCD GitOps</text>
  </g>

  <!-- Horizontal Pipeline Cards (5 Columns) -->
  <!-- Pipeline 1: PR Gatekeeper -->
  <g transform="translate(40, 90)">
    <rect width="216" height="555" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="216" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="p-header" fill="#38bdf8">1. PR Gatekeeper</text>
    <text x="14" y="56" class="p-tag" fill="#64748b">GITHUB ACTIONS</text>
    
    <g transform="translate(12, 70)">
      <rect width="192" height="110" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="110" rx="1.5" fill="#0071e3"/>
      <text x="12" y="22" class="p-node-title">Automated Checks</text>
      <text x="12" y="42" class="p-code">• Pytest (35 tests)</text>
      <text x="12" y="58" class="p-code">• Ruff Python Linter</text>
      <text x="12" y="74" class="p-code">• Vite React Build</text>
      <text x="12" y="90" class="p-code">• Helm Template Lint</text>
    </g>

    <g transform="translate(12, 195)">
      <rect width="192" height="85" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Merge Conditions</text>
      <text x="12" y="42" class="p-node-desc">• 100% Gates Green</text>
      <text x="12" y="58" class="p-node-desc">• Branch Protection Rule</text>
      <text x="12" y="74" class="p-node-desc">• Required Peer Sign-off</text>
    </g>

    <g transform="translate(12, 295)">
      <rect width="192" height="120" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Trigger Event</text>
      <text x="12" y="42" class="p-code">• pull_request: [main]</text>
      <text x="12" y="58" class="p-node-desc">Runs in 4 parallel jobs</text>
      <text x="12" y="76" class="p-code">• Fail-fast enabled</text>
      <text x="12" y="96" class="p-node-desc">Execution time: ~42s</text>
    </g>

    <g transform="translate(12, 430)">
      <rect width="192" height="105" rx="8" fill="#141926" stroke="#222a3d" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title" fill="#38bdf8">Output Artifacts</text>
      <text x="12" y="42" class="p-code">• JUnit Test Reports</text>
      <text x="12" y="58" class="p-code">• Coverage Badge (94%)</text>
      <text x="12" y="74" class="p-code">• Helm Lint Verification</text>
    </g>
  </g>

  <!-- Pipeline 2: Terraform IaC -->
  <g transform="translate(272, 90)">
    <rect width="216" height="555" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="216" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="p-header" fill="#a855f7">2. Terraform IaC</text>
    <text x="14" y="56" class="p-tag" fill="#64748b">TERRAFORM WORKSPACES</text>

    <g transform="translate(12, 70)">
      <rect width="192" height="110" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="110" rx="1.5" fill="#8b5cf6"/>
      <text x="12" y="22" class="p-node-title">PR Plan / Merge Apply</text>
      <text x="12" y="42" class="p-code">• S3 Remote State</text>
      <text x="12" y="58" class="p-code">• DynamoDB Locking</text>
      <text x="12" y="74" class="p-code">• Multi-AZ VPC /20</text>
      <text x="12" y="90" class="p-code">• AWS EKS + ALB + WAF</text>
    </g>

    <g transform="translate(12, 195)">
      <rect width="192" height="85" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Blast Radius Guard</text>
      <text x="12" y="42" class="p-node-desc">• Separate dev / prod</text>
      <text x="12" y="58" class="p-node-desc">• Least-Privilege IAM</text>
      <text x="12" y="74" class="p-node-desc">• Drift Detection Alert</text>
    </g>

    <g transform="translate(12, 295)">
      <rect width="192" height="120" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Resources Created</text>
      <text x="12" y="42" class="p-code">• VPC 10.0.0.0/16</text>
      <text x="12" y="58" class="p-code">• 2x NAT Gateways</text>
      <text x="12" y="74" class="p-code">• EKS v1.31 Control Plane</text>
      <text x="12" y="90" class="p-code">• WAFv2 Web ACL (6 rules)</text>
    </g>

    <g transform="translate(12, 430)">
      <rect width="192" height="105" rx="8" fill="#141926" stroke="#222a3d" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title" fill="#a855f7">State Output</text>
      <text x="12" y="42" class="p-code">• tfstate S3 Bucket</text>
      <text x="12" y="58" class="p-code">• EKS Cluster Endpoint</text>
      <text x="12" y="74" class="p-code">• OIDC IAM Provider ARN</text>
    </g>
  </g>

  <!-- Pipeline 3: Jenkins CI -->
  <g transform="translate(504, 90)">
    <rect width="216" height="555" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="216" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="p-header" fill="#f59e0b">3. Jenkins CI</text>
    <text x="14" y="56" class="p-tag" fill="#64748b">ENTERPRISE RELEASE</text>

    <g transform="translate(12, 70)">
      <rect width="192" height="110" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="110" rx="1.5" fill="#f59e0b"/>
      <text x="12" y="22" class="p-node-title">Build &amp; Security</text>
      <text x="12" y="42" class="p-code">• Declarative Groovy</text>
      <text x="12" y="58" class="p-code">• Trivy CVE Scanner</text>
      <text x="12" y="74" class="p-code">• Immutable Images</text>
      <text x="12" y="90" class="p-code">• AWS ECR Registry</text>
    </g>

    <g transform="translate(12, 195)">
      <rect width="192" height="85" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Audit Trail</text>
      <text x="12" y="42" class="p-node-desc">• Git SHA Tagging</text>
      <text x="12" y="58" class="p-node-desc">• Build Provenance Log</text>
      <text x="12" y="74" class="p-node-desc">• Nonce Verification</text>
    </g>

    <g transform="translate(12, 295)">
      <rect width="192" height="120" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">GitOps Update</text>
      <text x="12" y="42" class="p-code">• git clone manifest repo</text>
      <text x="12" y="58" class="p-code">• update values-dev.yaml</text>
      <text x="12" y="74" class="p-code">• git commit [skip ci]</text>
      <text x="12" y="90" class="p-code">• git push origin main</text>
    </g>

    <g transform="translate(12, 430)">
      <rect width="192" height="105" rx="8" fill="#141926" stroke="#222a3d" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title" fill="#f59e0b">Published Images</text>
      <text x="12" y="42" class="p-code">• backend:v1.28-build42</text>
      <text x="12" y="58" class="p-code">• frontend:v1.28-build42</text>
      <text x="12" y="74" class="p-code">• Trivy: 0 High/Crit CVEs</text>
    </g>
  </g>

  <!-- Pipeline 4: Serverless Edge -->
  <g transform="translate(736, 90)">
    <rect width="216" height="555" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="216" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="p-header" fill="#06b6d4">4. CloudFront Edge</text>
    <text x="14" y="56" class="p-tag" fill="#64748b">SERVERLESS CDN</text>

    <g transform="translate(12, 70)">
      <rect width="192" height="110" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="110" rx="1.5" fill="#06b6d4"/>
      <text x="12" y="22" class="p-node-title">Static Asset Sync</text>
      <text x="12" y="42" class="p-code">• AWS S3 Sync (dist/)</text>
      <text x="12" y="58" class="p-code">• Origin Access (OAC)</text>
      <text x="12" y="74" class="p-code">• Cache Invalidation</text>
      <text x="12" y="90" class="p-code">• Global Edge Flush</text>
    </g>

    <g transform="translate(12, 195)">
      <rect width="192" height="85" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Edge Performance</text>
      <text x="12" y="42" class="p-node-desc">• Gzip &amp; Brotli Caching</text>
      <text x="12" y="58" class="p-node-desc">• 0ms Origin Roundtrip</text>
      <text x="12" y="74" class="p-node-desc">• TTL: 31,536,000s on JS</text>
    </g>

    <g transform="translate(12, 295)">
      <rect width="192" height="120" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title">Invalidation Strategy</text>
      <text x="12" y="42" class="p-code">• aws cloudfront create-</text>
      <text x="12" y="58" class="p-code">  invalidation --paths</text>
      <text x="12" y="74" class="p-code">  "/index.html" "/assets/*"</text>
      <text x="12" y="90" class="p-node-desc">Instant edge propagation</text>
    </g>

    <g transform="translate(12, 430)">
      <rect width="192" height="105" rx="8" fill="#141926" stroke="#222a3d" stroke-width="1"/>
      <text x="12" y="22" class="p-node-title" fill="#06b6d4">Edge Endpoints</text>
      <text x="12" y="42" class="p-code">• *.cloudfront.net</text>
      <text x="12" y="58" class="p-code">• TLS 1.3 / HTTP/3</text>
      <text x="12" y="74" class="p-code">• WAF Protected Ingress</text>
    </g>
  </g>

  <!-- Pipeline 5: In-Cluster GitOps -->
  <g transform="translate(968, 90)">
    <rect width="192" height="555" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="192" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="p-header" fill="#10b981">5. ArgoCD</text>
    <text x="14" y="56" class="p-tag" fill="#64748b">GITOPS CONTROLLER</text>

    <g transform="translate(12, 70)">
      <rect width="168" height="110" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="110" rx="1.5" fill="#10b981"/>
      <text x="10" y="22" class="p-node-title">Automated Sync</text>
      <text x="10" y="42" class="p-code">• In-Cluster Pull</text>
      <text x="10" y="58" class="p-code">• Drift Detection</text>
      <text x="10" y="74" class="p-code">• Rolling Updates</text>
      <text x="10" y="90" class="p-code">• Instant Rollback</text>
    </g>

    <g transform="translate(12, 195)">
      <rect width="168" height="85" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="10" y="22" class="p-node-title">Zero Secrets</text>
      <text x="10" y="42" class="p-node-desc">• No kubectl in CI</text>
      <text x="10" y="58" class="p-node-desc">• In-Cluster SA token</text>
      <text x="10" y="74" class="p-node-desc">• Strict Private Subnets</text>
    </g>

    <g transform="translate(12, 295)">
      <rect width="168" height="120" rx="8" fill="url(#cardGrad2)" stroke="#272e40" stroke-width="1"/>
      <text x="10" y="22" class="p-node-title">Reconcile Loop</text>
      <text x="10" y="42" class="p-code">• 3m Poll Interval</text>
      <text x="10" y="58" class="p-code">• Webhook Trigger</text>
      <text x="10" y="74" class="p-code">• Auto-heal enabled</text>
      <text x="10" y="90" class="p-code">• Prune resources</text>
    </g>

    <g transform="translate(12, 430)">
      <rect width="168" height="105" rx="8" fill="#141926" stroke="#222a3d" stroke-width="1"/>
      <text x="10" y="22" class="p-node-title" fill="#10b981">Live Cluster State</text>
      <text x="10" y="42" class="p-code">• Synced</text>
      <text x="10" y="58" class="p-code">• Healthy</text>
      <text x="10" y="74" class="p-code">• 0 Configuration Drift</text>
    </g>
  </g>
</svg>
"""


def build_aws_vpc_architecture_svg() -> str:
    """Multi-AZ High-Density AWS VPC Topology (/20 Subnets & NAT Gateways)."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="subGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141824"/>
      <stop offset="100%" stop-color="#0f121c"/>
    </linearGradient>
  </defs>

  <style>
    .v-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .v-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .v-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .v-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .v-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .v-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  </style>

  <rect width="1200" height="700" rx="16" fill="url(#bgGrad3)"/>
  <rect x="1" y="1" width="1198" height="698" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="v-title">SimianX · Multi-AZ High-Density AWS VPC Networking Architecture</text>
    <text x="0" y="36" class="v-sub">VPC CIDR: 10.0.0.0/16 · 65,536 Total IPs · High-Density /20 Private Worker Subnets (4,096 IPs per AZ) Preventing CNI Exhaustion</text>
  </g>

  <!-- AWS Region Wrapper -->
  <g transform="translate(40, 85)">
    <rect width="1120" height="575" rx="14" fill="#0d1017" stroke="#252b3b" stroke-width="1.2"/>
    <text x="20" y="24" class="v-header" fill="#f59e0b">AWS Region: ap-south-1 (Mumbai) · VPC 10.0.0.0/16</text>

    <!-- Edge / Internet Gateway -->
    <g transform="translate(460, 38)">
      <rect width="200" height="38" rx="8" fill="#1b2030" stroke="#0071e3" stroke-width="1.2"/>
      <text x="100" y="24" class="v-node-title" text-anchor="middle">Internet Gateway (IGW)</text>
    </g>

    <!-- Availability Zone 1 (Left) -->
    <g transform="translate(20, 95)">
      <rect width="525" height="455" rx="12" fill="#111420" stroke="#232838" stroke-width="1"/>
      <text x="18" y="24" class="v-header" fill="#38bdf8">Availability Zone: ap-south-1a</text>

      <!-- Public Subnet 1a -->
      <g transform="translate(18, 38)">
        <rect width="489" height="100" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="100" rx="2" fill="#0071e3"/>
        <text x="16" y="24" class="v-node-title">Public Subnet 1a · 10.0.1.0/24 (256 IPs)</text>
        <text x="16" y="44" class="v-code">• AWS ALB External Ingress Listener (:80/:443)</text>
        <text x="16" y="60" class="v-code">• NAT Gateway 1a (Elastic IP attached)</text>
        <text x="16" y="76" class="v-code">• Default Route: 0.0.0.0/0 → Internet Gateway</text>
        <text x="396" y="24" class="v-tag" fill="#38bdf8">PUBLIC /24</text>
      </g>

      <!-- Private Subnet 1a (High-Density EKS) -->
      <g transform="translate(18, 150)">
        <rect width="489" height="162" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="162" rx="2" fill="#10b981"/>
        <text x="16" y="24" class="v-node-title">Private EKS Subnet 1a · 10.0.16.0/20 (4,096 IPs)</text>
        <text x="16" y="44" class="v-code">• EKS Managed Node Groups (m6i.xlarge EC2 Instances)</text>
        <text x="16" y="60" class="v-code">• AWS VPC CNI Secondary IP Allocation (Zero IP Exhaustion)</text>
        <text x="16" y="76" class="v-code">• SimianX Backend Replicas (FastAPI :8000)</text>
        <text x="16" y="92" class="v-code">• SimianX Frontend Replicas (Nginx + React 19 :80)</text>
        <text x="16" y="108" class="v-code">• Prometheus TSDB Pod (:9090)</text>
        <text x="16" y="124" class="v-code">• Default Route: 0.0.0.0/0 → NAT Gateway 1a</text>
        <text x="360" y="24" class="v-tag" fill="#34c759">EKS WORKLOADS /20</text>
      </g>

      <!-- Database Subnet 1a -->
      <g transform="translate(18, 324)">
        <rect width="489" height="105" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="105" rx="2" fill="#8b5cf6"/>
        <text x="16" y="24" class="v-node-title">Isolated DB Subnet 1a · 10.0.48.0/24 (256 IPs)</text>
        <text x="16" y="44" class="v-code">• No Internet Access (Zero Inbound/Outbound Route)</text>
        <text x="16" y="60" class="v-code">• RDS PostgreSQL Multi-AZ Primary Instance</text>
        <text x="16" y="76" class="v-code">• Protected by Database Security Group (Port 5432 from EKS)</text>
        <text x="386" y="24" class="v-tag" fill="#c084fc">ISOLATED /24</text>
      </g>
    </g>

    <!-- Availability Zone 2 (Right) -->
    <g transform="translate(575, 95)">
      <rect width="525" height="455" rx="12" fill="#111420" stroke="#232838" stroke-width="1"/>
      <text x="18" y="24" class="v-header" fill="#38bdf8">Availability Zone: ap-south-1b</text>

      <!-- Public Subnet 1b -->
      <g transform="translate(18, 38)">
        <rect width="489" height="100" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="100" rx="2" fill="#0071e3"/>
        <text x="16" y="24" class="v-node-title">Public Subnet 1b · 10.0.2.0/24 (256 IPs)</text>
        <text x="16" y="44" class="v-code">• AWS ALB Multi-AZ Redundant Target</text>
        <text x="16" y="60" class="v-code">• NAT Gateway 1b (Elastic IP attached)</text>
        <text x="16" y="76" class="v-code">• Default Route: 0.0.0.0/0 → Internet Gateway</text>
        <text x="396" y="24" class="v-tag" fill="#38bdf8">PUBLIC /24</text>
      </g>

      <!-- Private Subnet 1b (High-Density EKS) -->
      <g transform="translate(18, 150)">
        <rect width="489" height="162" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="162" rx="2" fill="#10b981"/>
        <text x="16" y="24" class="v-node-title">Private EKS Subnet 1b · 10.0.32.0/20 (4,096 IPs)</text>
        <text x="16" y="44" class="v-code">• EKS Managed Node Groups (Multi-AZ Failover Target)</text>
        <text x="16" y="60" class="v-code">• AWS VPC CNI High-Density IP Pool</text>
        <text x="16" y="76" class="v-code">• SimianX Backend Pod Replicas</text>
        <text x="16" y="92" class="v-code">• SimianX Frontend Pod Replicas</text>
        <text x="16" y="108" class="v-code">• Cross-AZ Pod Anti-Affinity Topology Distribution</text>
        <text x="16" y="124" class="v-code">• Default Route: 0.0.0.0/0 → NAT Gateway 1b</text>
        <text x="360" y="24" class="v-tag" fill="#34c759">EKS WORKLOADS /20</text>
      </g>

      <!-- Database Subnet 1b -->
      <g transform="translate(18, 324)">
        <rect width="489" height="105" rx="10" fill="url(#subGrad)" stroke="#2b3245" stroke-width="1"/>
        <rect x="0" y="0" width="4" height="105" rx="2" fill="#8b5cf6"/>
        <text x="16" y="24" class="node-title">Isolated DB Subnet 1b · 10.0.49.0/24 (256 IPs)</text>
        <text x="16" y="44" class="v-code">• No Internet Access (Air-Gapped Private Subnet)</text>
        <text x="16" y="60" class="v-code">• RDS PostgreSQL Multi-AZ Standby Replica</text>
        <text x="16" y="76" class="v-code">• Synchronous Block-Level Replication across AZs</text>
        <text x="386" y="24" class="v-tag" fill="#c084fc">ISOLATED /24</text>
      </g>
    </g>
  </g>
</svg>
"""


def build_edge_waf_architecture_svg() -> str:
    """CloudFront Multi-Origin CDN, AWS WAFv2 Web ACL, S3 OAC & ALB Dynamic Ingress."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" width="100%" height="100%">
  <defs>
    <linearGradient id="bgWAF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="wafCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181c28"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>
    <marker id="w-arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
    <marker id="w-arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34c759"/>
    </marker>
    <marker id="w-arr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e"/>
    </marker>
  </defs>

  <style>
    .w-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .w-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .w-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .w-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .w-desc { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; fill: #94a3b8; }
    .w-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .w-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  </style>

  <rect width="1200" height="680" rx="16" fill="url(#bgWAF)"/>
  <rect x="1" y="1" width="1198" height="678" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="w-title">SimianX · Edge Security &amp; Multi-Origin CloudFront WAF Architecture</text>
    <text x="0" y="36" class="w-sub">Unified Global Edge Ingress: AWS WAFv2 Web ACL, S3 Origin Access Control (OAC), and Dynamic Ingress to EKS Application Load Balancers</text>
  </g>

  <!-- Section 1: Client Internet Traffic (Top) -->
  <g transform="translate(40, 85)">
    <rect width="1120" height="70" rx="12" fill="#10131d" stroke="#222838" stroke-width="1.2"/>
    <text x="24" y="24" class="w-header" fill="#64748b">Client Traffic Origin</text>
    <g transform="translate(24, 34)">
      <text x="0" y="18" class="w-node-title">Global Client Web Browsers &amp; HTTP Clients</text>
      <text x="350" y="18" class="w-desc">Single-domain HTTPS (TLS 1.2 / TLS 1.3) · Zero CORS preflights</text>
      <text x="960" y="18" class="w-tag" fill="#38bdf8">CLIENT TRAFFIC</text>
    </g>
  </g>

  <!-- Arrow Client -> WAF -->
  <path d="M 600 155 L 600 180" stroke="#38bdf8" stroke-width="2" marker-end="url(#w-arr-blue)"/>

  <!-- Section 2: AWS Global Edge Tier (CloudFront + WAFv2) -->
  <g transform="translate(40, 180)">
    <rect width="1120" height="215" rx="14" fill="#0e111a" stroke="#0071e3" stroke-width="1.2"/>
    <rect x="0" y="0" width="1120" height="36" rx="14" fill="#141926"/>
    <circle cx="20" cy="18" r="5" fill="#0071e3"/>
    <text x="34" y="23" class="w-header" fill="#38bdf8">AWS Global Edge Network (Scope: CLOUDFRONT in us-east-1)</text>

    <!-- WAF Card (Left, width 520) -->
    <g transform="translate(20, 50)">
      <rect width="520" height="145" rx="10" fill="url(#wafCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="145" rx="2" fill="#0071e3"/>
      <text x="18" y="24" class="w-node-title">AWS WAFv2 Web ACL (6 Enterprise Rule Sets)</text>
      <text x="18" y="44" class="w-code">• AWSManagedRulesCommonRuleSet (OWASP Top 10: XSS, Path Traversal)</text>
      <text x="18" y="60" class="w-code">• AWSManagedRulesKnownBadInputsRuleSet (RCE, Log4j, Command Injection)</text>
      <text x="18" y="76" class="w-code">• AWSManagedRulesAmazonIpReputationList (Known malicious scanners &amp; bots)</text>
      <text x="18" y="92" class="w-code">• AWSManagedRulesAnonymousIpList (Tor exit nodes, suspicious VPNs, hosting IPs)</text>
      <text x="18" y="108" class="w-code">• AWSManagedRulesSQLiRuleSet (SQL injection detection &amp; request sanitization)</text>
      <text x="18" y="124" class="w-code">• RateLimitPerIP: 2,000 requests per 5-minute evaluation window</text>
      <text x="440" y="24" class="w-tag" fill="#38bdf8">WAF ACL</text>
    </g>

    <!-- CloudFront Distribution (Right, width 520) -->
    <g transform="translate(580, 50)">
      <rect width="520" height="145" rx="10" fill="url(#wafCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="145" rx="2" fill="#10b981"/>
      <text x="18" y="24" class="w-node-title">CloudFront Global CDN (d187dv15yxfrzi.cloudfront.net)</text>
      <text x="18" y="44" class="w-code">• Behavior 1: Path `/*` (Default) → AWS S3 Frontend Bucket (OAC)</text>
      <text x="18" y="60" class="w-code">  - Cache Policy: Managed-CachingOptimized (Brotli/Gzip edge compression)</text>
      <text x="18" y="76" class="w-code">  - Viewer Protocol: Redirect HTTP to HTTPS</text>
      <text x="18" y="96" class="w-code">• Behavior 2: Path `/api/*` → AWS EKS Application Load Balancer</text>
      <text x="18" y="112" class="w-code">  - Cache Policy: Managed-CachingDisabled (Zero caching on dynamic APIs)</text>
      <text x="18" y="128" class="w-code">  - Origin Request Policy: AllViewerExceptHostHeader (preserves headers &amp; cookies)</text>
      <text x="440" y="24" class="w-tag" fill="#34c759">MULTI-ORIGIN</text>
    </g>
  </g>

  <!-- Connectors from CloudFront to Backend Targets -->
  <path d="M 720 395 L 320 440" stroke="#f59e0b" stroke-width="2" marker-end="url(#w-arr-blue)"/>
  <rect x="420" y="405" width="140" height="22" rx="4" fill="#111622" stroke="#252e42" stroke-width="1"/>
  <text x="428" y="420" class="w-code" fill="#f59e0b">GET /* (Static UI)</text>

  <path d="M 960 395 L 960 440" stroke="#34c759" stroke-width="2" marker-end="url(#w-arr-green)"/>
  <rect x="910" y="405" width="140" height="22" rx="4" fill="#111622" stroke="#252e42" stroke-width="1"/>
  <text x="918" y="420" class="w-code" fill="#34c759">ANY /api/* (Dynamic)</text>

  <!-- Section 3: Dual Destination Tier (Bottom) -->
  <!-- Target A: Amazon S3 Private Bucket (Left) -->
  <g transform="translate(40, 440)">
    <rect width="520" height="200" rx="14" fill="#0e111a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="520" height="36" rx="14" fill="#141926"/>
    <circle cx="20" cy="18" r="5" fill="#f59e0b"/>
    <text x="34" y="23" class="w-header" fill="#fb923c">Static Storage: Amazon S3 (ap-south-1)</text>
    <text x="400" y="24" class="w-tag" fill="#f59e0b">ORIGIN: S3</text>

    <g transform="translate(20, 50)">
      <text x="0" y="20" class="w-node-title">S3 Private Bucket: simianx-frontend-dev</text>
      <text x="0" y="40" class="w-code">• 100% Private: Block Public Access (All 4 settings ON)</text>
      <text x="0" y="58" class="w-code">• SigV4 Origin Access Control (OAC): No public S3 read policies</text>
      <text x="0" y="76" class="w-code">• Server-Side Encryption: AES-256 (SSE-S3)</text>
      <text x="0" y="94" class="w-code">• Vite React 19 Single Page App assets (`dist/`)</text>
      <text x="0" y="112" class="w-code">• Custom Error Response: HTTP 403/404 → `/index.html` (HTTP 200 SPA client router)</text>
    </g>
  </g>

  <!-- Target B: AWS ALB & EKS Worker Tier (Right) -->
  <g transform="translate(640, 440)">
    <rect width="520" height="200" rx="14" fill="#0e111a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="520" height="36" rx="14" fill="#141824"/>
    <circle cx="20" cy="18" r="5" fill="#10b981"/>
    <text x="34" y="23" class="w-header" fill="#34c759">Dynamic Compute: AWS ALB &amp; EKS Ingress (ap-south-1)</text>
    <text x="400" y="24" class="w-tag" fill="#34c759">ORIGIN: ALB</text>

    <g transform="translate(20, 50)">
      <text x="0" y="20" class="w-node-title">AWS Application Load Balancer (Public Subnets /24)</text>
      <text x="0" y="40" class="w-code">• Managed by AWS Load Balancer Controller v2.8</text>
      <text x="0" y="58" class="w-code">• TargetGroup Binding: Forward to NodePort on EKS Worker Nodes</text>
      <text x="0" y="76" class="w-code">• Health Check: GET /health on port 8000 (interval: 15s)</text>
      <text x="0" y="94" class="w-code">• Dynamic Endpoints: /api/v1/chaos/stream, /metrics, /api/v1/traces</text>
      <text x="0" y="112" class="w-code">• ClientIP Sticky Sessions (10,800s timeout) for telemetry state continuity</text>
    </g>
  </g>
</svg>
"""


def build_slack_alerting_pipeline_svg() -> str:
    """Production SRE Slack Incident Alerting Engine."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSlack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="sCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181c28"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>
    <marker id="s-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e"/>
    </marker>
    <marker id="s-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b"/>
    </marker>
    <marker id="s-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981"/>
    </marker>
    <marker id="s-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
  </defs>

  <style>
    .s-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .s-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .s-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .s-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .s-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .s-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  </style>

  <rect width="1200" height="520" rx="16" fill="url(#bgSlack)"/>
  <rect x="1" y="1" width="1198" height="518" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="s-title">SimianX · Production SRE Slack Incident Alerting Engine</text>
    <text x="0" y="36" class="s-sub">Continuous Golden Signal Evaluation · Debounce Cooldown (60s) · Anti-Flapping Auto-Recovery · Rich Block Kit Cards</text>
  </g>

  <!-- Step 1: FastAPI Evaluation Loop (Left, x=40) -->
  <g transform="translate(40, 85)">
    <rect width="240" height="395" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="240" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="s-header" fill="#38bdf8">1. Telemetry Loop</text>
    
    <g transform="translate(14, 52)">
      <rect width="212" height="150" rx="8" fill="url(#sCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="150" rx="1.5" fill="#0071e3"/>
      <text x="12" y="22" class="s-node-title">FastAPI Lifespan</text>
      <text x="12" y="44" class="s-code">• Every 3.0s Evaluation</text>
      <text x="12" y="62" class="s-code">• Thread-Safe RLock</text>
      <text x="12" y="80" class="s-code">• Queries MetricsCollector</text>
      <text x="12" y="98" class="s-code">• Window RPS &amp; Error Rate</text>
      <text x="12" y="116" class="s-code">• P95 &amp; P99 Quantiles</text>
      <text x="12" y="134" class="s-code">• Active Chaos Status</text>
    </g>

    <g transform="translate(14, 220)">
      <rect width="212" height="150" rx="8" fill="url(#sCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="150" rx="1.5" fill="#8b5cf6"/>
      <text x="12" y="22" class="s-node-title">Guard Engine</text>
      <text x="12" y="44" class="s-code">• 60s Debounce Cooldown</text>
      <text x="12" y="62" class="s-code">• Anti-Alert Fatigue</text>
      <text x="12" y="80" class="s-code">• Hysteresis State Gate</text>
      <text x="12" y="98" class="s-code">• 2 Consecutive Cycles</text>
      <text x="12" y="116" class="s-code">  to Auto-Resolve</text>
      <text x="12" y="134" class="s-code">• Masked Webhook URL</text>
    </g>
  </g>

  <!-- Connectors Step 1 -> Step 2 -->
  <path d="M 280 280 L 320 280" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#s-blue)"/>

  <!-- Step 2: Incident Threshold Classifiers (Middle, x=320) -->
  <g transform="translate(320, 85)">
    <rect width="360" height="395" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="360" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="s-header" fill="#a855f7">2. Incident Classification Gate</text>

    <!-- Critical Breach Card -->
    <g transform="translate(14, 50)">
      <rect width="332" height="96" rx="8" fill="#1f1115" stroke="#5c1d27" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="96" rx="2" fill="#f43f5e"/>
      <text x="14" y="24" class="s-node-title" fill="#fca5a5">CRITICAL: Error Rate &gt; 5.0%</text>
      <text x="14" y="46" class="s-code">• Severe customer-facing degradation</text>
      <text x="14" y="64" class="s-code">• Dispatches incident card with red banner</text>
      <text x="14" y="82" class="s-code">• Includes active error rate &amp; failing endpoints</text>
      <text x="248" y="24" class="s-tag" fill="#f43f5e">CRITICAL</text>
    </g>

    <!-- Warning Breach Card -->
    <g transform="translate(14, 160)">
      <rect width="332" height="96" rx="8" fill="#1f1811" stroke="#5c3b17" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="96" rx="2" fill="#f59e0b"/>
      <text x="14" y="24" class="s-node-title" fill="#fcd34d">WARNING: P95 Latency &gt; 250ms</text>
      <text x="14" y="46" class="s-code">• SLA headroom threshold violated</text>
      <text x="14" y="64" class="s-code">• Or active Chaos Fault injection detected</text>
      <text x="14" y="82" class="s-code">• Amber card with live millisecond latency</text>
      <text x="254" y="24" class="s-tag" fill="#f59e0b">WARNING</text>
    </g>

    <!-- Auto-Resolved Card -->
    <g transform="translate(14, 270)">
      <rect width="332" height="96" rx="8" fill="#0f1f16" stroke="#195436" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="96" rx="2" fill="#10b981"/>
      <text x="14" y="24" class="s-node-title" fill="#86efac">RESOLVED: 2 Healthy Cycles (6s)</text>
      <text x="14" y="46" class="s-code">• Error rate &lt; 5% AND P95 &lt; 250ms</text>
      <text x="14" y="64" class="s-code">• Auto-closes active incident in Slack</text>
      <text x="14" y="82" class="s-code">• Green recovery badge with duration</text>
      <text x="246" y="24" class="s-tag" fill="#10b981">RESOLVED</text>
    </g>
  </g>

  <!-- Connectors Step 2 -> Step 3 -->
  <path d="M 680 148 L 720 280" stroke="#f43f5e" stroke-width="1.5" marker-end="url(#s-red)"/>
  <path d="M 680 258 L 720 280" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#s-amber)"/>
  <path d="M 680 368 L 720 280" stroke="#10b981" stroke-width="1.5" marker-end="url(#s-green)"/>

  <!-- Step 3: Slack Webhook & Channel Delivery (Right, x=720) -->
  <g transform="translate(720, 85)">
    <rect width="440" height="395" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="440" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="s-header" fill="#10b981">3. Slack Channel Delivery</text>

    <!-- Webhook Dispatch Box -->
    <g transform="translate(14, 50)">
      <rect width="412" height="110" rx="8" fill="url(#sCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="110" rx="2" fill="#38bdf8"/>
      <text x="14" y="24" class="s-node-title">Slack Incoming Webhook (POST)</text>
      <text x="14" y="46" class="s-code">Payload: Slack Block Kit JSON</text>
      <text x="14" y="64" class="s-code">• HTTP/1.1 TLS 1.3 POST to https://hooks.slack.com/...</text>
      <text x="14" y="82" class="s-code">• Asynchronous non-blocking dispatch (zero worker stall)</text>
      <text x="14" y="100" class="s-code">• Timeout: 5.0s with error catch</text>
    </g>

    <!-- Slack Notification Card Mockup -->
    <g transform="translate(14, 180)">
      <rect width="412" height="185" rx="8" fill="#141722" stroke="#2e354a" stroke-width="1.2"/>
      <rect x="0" y="0" width="4" height="185" rx="2" fill="#f43f5e"/>
      <text x="16" y="24" class="s-node-title" fill="#f8fafc">SimianX SRE Sentinel Alert</text>
      <text x="320" y="24" class="s-tag" fill="#64748b">#sre-alerts</text>
      <path d="M 16 36 L 396 36" stroke="#252c3e" stroke-width="1"/>
      
      <text x="16" y="58" class="s-code" fill="#fca5a5">• Severity: CRITICAL (Error Rate Spike)</text>
      <text x="16" y="78" class="s-code">• Current Value: 34.3% errors (Threshold: 5.0%)</text>
      <text x="16" y="98" class="s-code">• Throughput: 44.8 RPS · P95 Latency: 482ms</text>
      <text x="16" y="118" class="s-code">• Cluster: AWS EKS (ap-south-1) · Namespace: simianx</text>
      <text x="16" y="138" class="s-code">• Triggered at: 2026-11-05T15:24:00Z</text>
      
      <g transform="translate(16, 148)">
        <rect width="130" height="26" rx="4" fill="#0071e3"/>
        <text x="14" y="17" class="s-code" fill="#ffffff" font-weight="600">Open Dashboard</text>
      </g>
      <g transform="translate(156, 148)">
        <rect width="130" height="26" rx="4" fill="#1e2436" stroke="#333c54" stroke-width="1"/>
        <text x="18" y="17" class="s-code" fill="#cbd5e1">Inspect Traces</text>
      </g>
    </g>
  </g>
</svg>
"""


def build_rolling_update_flow_svg() -> str:
    """Kubernetes Zero-Downtime Rolling Update & Graceful Pod Draining."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgRoll" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="rollCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181c28"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>
    <marker id="r-arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
    <marker id="r-arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34c759"/>
    </marker>
  </defs>

  <style>
    .r-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .r-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .r-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .r-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 600; fill: #f1f5f9; }
    .r-code { font-family: "SF Mono", monospace; font-size: 10.5px; fill: #cbd5e1; }
    .r-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  </style>

  <rect width="1200" height="500" rx="16" fill="url(#bgRoll)"/>
  <rect x="1" y="1" width="1198" height="498" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="r-title">SimianX · Kubernetes Zero-Downtime Rolling Update Architecture</text>
    <text x="0" y="36" class="r-sub">Readiness Probe Gatekeeping · ALB TargetGroup Registration · 30-Second SIGTERM Draining · Zero In-Flight Drops</text>
  </g>

  <!-- Step 1: GitOps Detection (Left, x=40) -->
  <g transform="translate(40, 85)">
    <rect width="250" height="375" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="250" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="r-header" fill="#38bdf8">1. GitOps Trigger</text>

    <g transform="translate(14, 50)">
      <rect width="222" height="130" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="130" rx="1.5" fill="#0071e3"/>
      <text x="12" y="22" class="r-node-title">Jenkins Git Commit</text>
      <text x="12" y="42" class="r-code">• Pushes new image tag</text>
      <text x="12" y="60" class="r-code">• values-dev.yaml</text>
      <text x="12" y="78" class="r-code">• tag: v1.28-build42</text>
      <text x="12" y="96" class="r-code">• Git commit: [skip ci]</text>
      <text x="12" y="114" class="r-code">• Audit trail locked</text>
    </g>

    <g transform="translate(14, 200)">
      <rect width="222" height="145" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="145" rx="1.5" fill="#8b5cf6"/>
      <text x="12" y="22" class="r-node-title">ArgoCD Controller</text>
      <text x="12" y="42" class="r-code">• Polls Git repo (3m / hook)</text>
      <text x="12" y="60" class="r-code">• Compares Git vs Live EKS</text>
      <text x="12" y="78" class="r-code">• Flags: OutOfSync</text>
      <text x="12" y="96" class="r-code">• Reconciles state</text>
      <text x="12" y="114" class="r-code">• maxSurge: 25%</text>
      <text x="12" y="132" class="r-code">• maxUnavailable: 0</text>
    </g>
  </g>

  <!-- Connector Step 1 -> Step 2 -->
  <path d="M 290 270 L 330 270" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#r-arr-blue)"/>

  <!-- Step 2: Pod Lifecycle & Rolling Update (Center, x=330) -->
  <g transform="translate(330, 85)">
    <rect width="530" height="375" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="530" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="r-header" fill="#10b981">2. Zero-Downtime Pod Rollout Sequence</text>

    <!-- Stage A: Spawn New Pod -->
    <g transform="translate(14, 46)">
      <rect width="502" height="68" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="68" rx="1.5" fill="#10b981"/>
      <text x="14" y="22" class="r-node-title">A. K8s Spawns New Pod with New Image</text>
      <text x="14" y="42" class="r-code">Image: simianx-backend:v1.28-build42 · Status: ContainerCreating → Running</text>
      <text x="14" y="58" class="r-code">Old pods continue taking 100% of live traffic without interruption</text>
      <text x="430" y="22" class="r-tag" fill="#10b981">SURGE +1</text>
    </g>

    <!-- Stage B: Readiness Probe Gate -->
    <g transform="translate(14, 126)">
      <rect width="502" height="68" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="68" rx="1.5" fill="#0071e3"/>
      <text x="14" y="22" class="r-node-title">B. Kubernetes Readiness Probe Evaluation</text>
      <text x="14" y="42" class="r-code">GET /health on port 8000 every 5 seconds (initialDelaySeconds: 5)</text>
      <text x="14" y="58" class="r-code">Pod marked READY only when HTTP 200 OK received with healthy database check</text>
      <text x="420" y="22" class="r-tag" fill="#38bdf8">READINESS</text>
    </g>

    <!-- Stage C: ALB TargetGroup Shift -->
    <g transform="translate(14, 206)">
      <rect width="502" height="68" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="68" rx="1.5" fill="#f59e0b"/>
      <text x="14" y="22" class="r-node-title">C. Ingress Routing Cutover</text>
      <text x="14" y="42" class="r-code">AWS Load Balancer Controller registers New Pod IP into ALB TargetGroup</text>
      <text x="14" y="58" class="r-code">ALB health check succeeds: traffic immediately begins routing to New Pod</text>
      <text x="410" y="22" class="r-tag" fill="#f59e0b">ALB TRAFFIC</text>
    </g>

    <!-- Stage D: Graceful Draining -->
    <g transform="translate(14, 286)">
      <rect width="502" height="68" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="68" rx="1.5" fill="#f43f5e"/>
      <text x="14" y="22" class="r-node-title">D. Graceful Termination of Old Pod (SIGTERM)</text>
      <text x="14" y="42" class="r-code">ALB deregisters Old Pod · 30-second connection draining grace period starts</text>
      <text x="14" y="58" class="r-code">FastAPI finishes in-flight HTTP requests · Clean zero-error termination</text>
      <text x="416" y="22" class="r-tag" fill="#f43f5e">DRAIN &amp; EXIT</text>
    </g>
  </g>

  <!-- Connector Step 2 -> Step 3 -->
  <path d="M 860 270 L 900 270" stroke="#34c759" stroke-width="1.8" marker-end="url(#r-arr-green)"/>

  <!-- Step 3: Verified Status (Right, x=900) -->
  <g transform="translate(900, 85)">
    <rect width="260" height="375" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="260" height="34" rx="12" fill="#141824"/>
    <text x="14" y="22" class="r-header" fill="#34c759">3. Final State</text>

    <g transform="translate(14, 50)">
      <rect width="232" height="180" rx="8" fill="#0e1f16" stroke="#1a5436" stroke-width="1.2"/>
      <circle cx="28" cy="28" r="12" fill="#10b981" fill-opacity="0.2"/>
      <circle cx="28" cy="28" r="6" fill="#10b981"/>
      <text x="50" y="32" class="r-node-title" fill="#86efac">Healthy &amp; Synced</text>
      
      <text x="14" y="66" class="r-code">• 0 Dropped Requests</text>
      <text x="14" y="86" class="r-code">• 0 In-Flight Errors</text>
      <text x="14" y="106" class="r-code">• 100% Golden Signals Green</text>
      <text x="14" y="126" class="r-code">• Telemetry Uninterrupted</text>
      <text x="14" y="146" class="r-code">• Activity Rings Continuous</text>
      <text x="14" y="166" class="r-code">• Git SHA Audit Verified</text>
    </g>

    <g transform="translate(14, 245)">
      <rect width="232" height="100" rx="8" fill="url(#rollCard)" stroke="#272e40" stroke-width="1"/>
      <text x="12" y="22" class="r-node-title">Auto-Rollback Guard</text>
      <text x="12" y="42" class="r-code">If New Pod fails readiness:</text>
      <text x="12" y="60" class="r-code">• Old Pod never killed</text>
      <text x="12" y="78" class="r-code">• Rollout halts safely</text>
      <text x="12" y="96" class="r-code">• Instant rollback to stable</text>
    </g>
  </g>
</svg>
"""


def build_kubernetes_packet_journey_svg() -> str:
    """Kubernetes Networking & In-Cluster Packet Journey (Browser to Pod)."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bgK8sNet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="100%" stop-color="#111420"/>
    </linearGradient>
    <linearGradient id="netCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181c28"/>
      <stop offset="100%" stop-color="#121520"/>
    </linearGradient>
    <marker id="net-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/>
    </marker>
  </defs>

  <style>
    .k-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-size: 21px; font-weight: 700; fill: #f8fafc; }
    .k-sub { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 12px; fill: #64748b; }
    .k-header { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .k-node-title { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12.5px; font-weight: 600; fill: #f1f5f9; }
    .k-code { font-family: "SF Mono", monospace; font-size: 10px; fill: #cbd5e1; }
    .k-tag { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .k-step { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 800; fill: #38bdf8; }
  </style>

  <rect width="1200" height="480" rx="16" fill="url(#bgK8sNet)"/>
  <rect x="1" y="1" width="1198" height="478" rx="15" fill="none" stroke="#1f2433" stroke-width="1.5"/>

  <!-- Top Title -->
  <g transform="translate(40, 36)">
    <text x="0" y="17" class="k-title">SimianX · Kubernetes Networking &amp; Packet Journey Under the Hood</text>
    <text x="0" y="36" class="k-sub">Linux Network Namespaces (netns) · veth Pairs · Kube-Proxy iptables NAT · CoreDNS Service Discovery · Pod Ingress</text>
  </g>

  <!-- 5 Sequential Packet Journey Cards -->
  <!-- 1. Client Browser -->
  <g transform="translate(40, 95)">
    <rect width="205" height="345" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="205" height="32" rx="12" fill="#141824"/>
    <text x="12" y="21" class="k-header" fill="#38bdf8">1. User Browser</text>
    <text x="12" y="52" class="k-tag" fill="#64748b">CLIENT ORIGIN</text>

    <g transform="translate(10, 65)">
      <rect width="185" height="260" rx="8" fill="url(#netCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="260" rx="1.5" fill="#0071e3"/>
      <text x="12" y="24" class="k-node-title">Host Request</text>
      <text x="12" y="46" class="k-code">• User clicks Action</text>
      <text x="12" y="66" class="k-code">• URL: localhost:30080</text>
      <text x="12" y="86" class="k-code">• OS creates TCP socket</text>
      <text x="12" y="106" class="k-code">• Sends TCP SYN packet</text>
      <text x="12" y="126" class="k-code">• Dst Port: 30080</text>
      <text x="12" y="146" class="k-code">• Dst IP: 127.0.0.1</text>
      <text x="12" y="172" class="k-node-title" fill="#38bdf8">Network Layer</text>
      <text x="12" y="192" class="k-code">• Host Loopback / Bridge</text>
      <text x="12" y="212" class="k-code">• Docker NAT Port Forward</text>
      <text x="12" y="232" class="k-code">• Hits K8s NodePort</text>
    </g>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 245 260 L 275 260" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#net-blue)"/>

  <!-- 2. NodePort & Kube-Proxy iptables -->
  <g transform="translate(275, 95)">
    <rect width="205" height="345" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="205" height="32" rx="12" fill="#141824"/>
    <text x="12" y="21" class="k-header" fill="#a855f7">2. Kube-Proxy NAT</text>
    <text x="12" y="52" class="k-tag" fill="#64748b">KERNEL IPTABLES</text>

    <g transform="translate(10, 65)">
      <rect width="185" height="260" rx="8" fill="url(#netCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="260" rx="1.5" fill="#8b5cf6"/>
      <text x="12" y="24" class="k-node-title">iptables KUBE-NODEPORTS</text>
      <text x="12" y="46" class="k-code">• Match: port 30080</text>
      <text x="12" y="66" class="k-code">• Kube-Proxy manages</text>
      <text x="12" y="86" class="k-code">  kernel PREROUTING table</text>
      <text x="12" y="106" class="k-code">• Probabilistic DNAT rule</text>
      <text x="12" y="126" class="k-code">• Packet Dst rewritten</text>
      <text x="12" y="146" class="k-code">  to Nginx Pod IP:</text>
      <text x="12" y="164" class="k-code" fill="#f59e0b">  10.244.0.19:80</text>
      <text x="12" y="190" class="k-node-title" fill="#a855f7">Zero Context Switch</text>
      <text x="12" y="210" class="k-code">• In-kernel packet</text>
      <text x="12" y="230" class="k-code">  translation (<0.1ms)</text>
    </g>
  </g>

  <!-- Arrow 2 -> 3 -->
  <path d="M 480 260 L 510 260" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#net-blue)"/>

  <!-- 3. Nginx Pod Ingress -->
  <g transform="translate(510, 95)">
    <rect width="205" height="345" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="205" height="32" rx="12" fill="#141824"/>
    <text x="12" y="21" class="k-header" fill="#10b981">3. Nginx Pod</text>
    <text x="12" y="52" class="k-tag" fill="#64748b">VETH PAIR / SPA REVERSE PROXY</text>

    <g transform="translate(10, 65)">
      <rect width="185" height="260" rx="8" fill="url(#netCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="260" rx="1.5" fill="#10b981"/>
      <text x="12" y="24" class="k-node-title">Virtual Ethernet (veth)</text>
      <text x="12" y="46" class="k-code">• Packet enters pod netns</text>
      <text x="12" y="66" class="k-code">  via eth0 interface</text>
      <text x="12" y="86" class="k-code">• Nginx receives frame</text>
      <text x="12" y="106" class="k-code">• Match: location /api/v1</text>
      <text x="12" y="126" class="k-code">• proxy_pass config:</text>
      <text x="12" y="146" class="k-code" fill="#86efac">  http://simianx-backend</text>
      <text x="12" y="164" class="k-code" fill="#86efac">  :8000</text>
      <text x="12" y="190" class="k-node-title" fill="#10b981">In-Cluster DNS</text>
      <text x="12" y="210" class="k-code">• Triggers DNS lookup</text>
      <text x="12" y="230" class="k-code">  to CoreDNS server</text>
    </g>
  </g>

  <!-- Arrow 3 -> 4 -->
  <path d="M 715 260 L 745 260" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#net-blue)"/>

  <!-- 4. CoreDNS Service Discovery -->
  <g transform="translate(745, 95)">
    <rect width="205" height="345" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="205" height="32" rx="12" fill="#141824"/>
    <text x="12" y="21" class="k-header" fill="#06b6d4">4. CoreDNS</text>
    <text x="12" y="52" class="k-tag" fill="#64748b">SERVICE DISCOVERY</text>

    <g transform="translate(10, 65)">
      <rect width="185" height="260" rx="8" fill="url(#netCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="260" rx="1.5" fill="#06b6d4"/>
      <text x="12" y="24" class="k-node-title">DNS Resolution</text>
      <text x="12" y="46" class="k-code">• Resolv.conf appends:</text>
      <text x="12" y="66" class="k-code">  simianx.svc.cluster.local</text>
      <text x="12" y="86" class="k-code">• CoreDNS answers in</text>
      <text x="12" y="104" class="k-code">  &lt;0.5ms with ClusterIP:</text>
      <text x="12" y="122" class="k-code" fill="#38bdf8">  10.96.142.88</text>
      <text x="12" y="148" class="k-node-title" fill="#06b6d4">Virtual ClusterIP</text>
      <text x="12" y="168" class="k-code">• Virtual VIP (no real NIC)</text>
      <text x="12" y="188" class="k-code">• Second iptables hop</text>
      <text x="12" y="208" class="k-code">• KUBE-SERVICES chain</text>
      <text x="12" y="228" class="k-code">  balances to active pods</text>
    </g>
  </g>

  <!-- Arrow 4 -> 5 -->
  <path d="M 950 260 L 980 260" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#net-blue)"/>

  <!-- 5. FastAPI Backend Pod Fleet -->
  <g transform="translate(980, 95)">
    <rect width="180" height="345" rx="12" fill="#0f121a" stroke="#222838" stroke-width="1.2"/>
    <rect x="0" y="0" width="180" height="32" rx="12" fill="#141824"/>
    <text x="12" y="21" class="k-header" fill="#f59e0b">5. Backend Pod</text>
    <text x="12" y="52" class="k-tag" fill="#64748b">FASTAPI CORE</text>

    <g transform="translate(10, 65)">
      <rect width="160" height="260" rx="8" fill="url(#netCard)" stroke="#262d3e" stroke-width="1"/>
      <rect x="0" y="0" width="3" height="260" rx="1.5" fill="#f59e0b"/>
      <text x="12" y="24" class="k-node-title">Execution</text>
      <text x="12" y="46" class="k-code">• Dst: 10.244.0.2:8000</text>
      <text x="12" y="66" class="k-code">• Enters pod netns</text>
      <text x="12" y="86" class="k-code">• OTel Span created</text>
      <text x="12" y="106" class="k-code">• Middleware tracks time</text>
      <text x="12" y="126" class="k-code">• Executes endpoint</text>
      <text x="12" y="146" class="k-code">• Increments histogram</text>
      <text x="12" y="172" class="k-node-title" fill="#f59e0b">Response Trip</text>
      <text x="12" y="192" class="k-code">• HTTP 200 / 5xx</text>
      <text x="12" y="212" class="k-code">• Connection-tracking</text>
      <text x="12" y="232" class="k-code">  reverses NAT flow</text>
    </g>
  </g>
</svg>
"""


def main():
    system_svg = build_system_architecture_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_system_architecture.svg"), "w", encoding="utf-8") as f:
        f.write(system_svg)
    print("✓ Created docs/screenshots/simianx_system_architecture.svg")

    pvp_svg = build_push_vs_pull_gitops_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_push_vs_pull_gitops.svg"), "w", encoding="utf-8") as f:
        f.write(pvp_svg)
    print("✓ Created docs/screenshots/simianx_push_vs_pull_gitops.svg")

    gitops_svg = build_gitops_pipeline_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_gitops_pipeline.svg"), "w", encoding="utf-8") as f:
        f.write(gitops_svg)
    print("✓ Created docs/screenshots/simianx_gitops_pipeline.svg")

    vpc_svg = build_aws_vpc_architecture_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_aws_vpc_architecture.svg"), "w", encoding="utf-8") as f:
        f.write(vpc_svg)
    print("✓ Created docs/screenshots/simianx_aws_vpc_architecture.svg")

    waf_svg = build_edge_waf_architecture_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_edge_waf_architecture.svg"), "w", encoding="utf-8") as f:
        f.write(waf_svg)
    print("✓ Created docs/screenshots/simianx_edge_waf_architecture.svg")

    slack_svg = build_slack_alerting_pipeline_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_slack_alerting_pipeline.svg"), "w", encoding="utf-8") as f:
        f.write(slack_svg)
    print("✓ Created docs/screenshots/simianx_slack_alerting_pipeline.svg")

    roll_svg = build_rolling_update_flow_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_rolling_update_flow.svg"), "w", encoding="utf-8") as f:
        f.write(roll_svg)
    print("✓ Created docs/screenshots/simianx_rolling_update_flow.svg")

    pkt_svg = build_kubernetes_packet_journey_svg()
    with open(os.path.join(SCREENSHOTS_DIR, "simianx_kubernetes_packet_journey.svg"), "w", encoding="utf-8") as f:
        f.write(pkt_svg)
    print("✓ Created docs/screenshots/simianx_kubernetes_packet_journey.svg")


if __name__ == "__main__":
    main()


