{{/*
Expand the name of the chart.
*/}}
{{- define "simianx.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "scalekart.name" -}}
{{- include "simianx.name" . }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "simianx.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}
{{- define "scalekart.fullname" -}}
{{- include "simianx.fullname" . }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "simianx.labels" -}}
helm.sh/chart: {{ include "simianx.chart" . }}
{{ include "simianx.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: simianx
{{- end }}
{{- define "scalekart.labels" -}}
{{- include "simianx.labels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "simianx.selectorLabels" -}}
app.kubernetes.io/name: {{ include "simianx.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "scalekart.selectorLabels" -}}
{{- include "simianx.selectorLabels" . }}
{{- end }}

{{/*
Chart name and version as used by the chart label.
*/}}
{{- define "simianx.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "scalekart.chart" -}}
{{- include "simianx.chart" . }}
{{- end }}
