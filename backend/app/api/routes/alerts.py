"""API route handlers for Slack incident alerts, status, and test notifications."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.slack_alerter import slack_alerter

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class SlackConfigRequest(BaseModel):
    webhook_url: str | None = Field(default=None, description="Incoming Slack Webhook URL")
    channel: str | None = Field(default=None, description="Slack channel name (e.g. #sre-alerts)")
    enabled: bool | None = Field(default=None, description="Toggle alerting on or off")
    cooldown_seconds: int | None = Field(default=None, description="Cooldown between repetitive alerts in seconds")
    error_threshold_pct: float | None = Field(default=None, description="Error rate percentage trigger threshold")
    latency_threshold_ms: float | None = Field(default=None, description="P95 latency ms trigger threshold")


class SlackTestRequest(BaseModel):
    webhook_url: str | None = Field(default=None, description="Optional custom webhook URL to test immediately")


@router.get(
    "/status",
    summary="Get Slack alerting status",
    description="Retrieve current Slack webhook configuration, firing state, and recent incident history.",
)
def get_alerts_status():
    return slack_alerter.get_status()


@router.post(
    "/config",
    summary="Update Slack alerting configuration",
    description="Dynamically configure or update the Slack Webhook URL, thresholds, and cooldown.",
)
def update_alerts_config(payload: SlackConfigRequest):
    return slack_alerter.set_config(
        webhook_url=payload.webhook_url,
        channel=payload.channel,
        enabled=payload.enabled,
        cooldown_seconds=payload.cooldown_seconds,
        error_threshold_pct=payload.error_threshold_pct,
        latency_threshold_ms=payload.latency_threshold_ms,
    )


@router.post(
    "/test",
    summary="Send test Slack notification",
    description="Send an instant verification message to Slack to verify webhook connectivity.",
)
async def send_test_slack_alert(payload: SlackTestRequest | None = None):
    custom_url = payload.webhook_url if payload else None
    success, message = await slack_alerter.send_test_alert(custom_webhook=custom_url)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return {"status": "success", "message": message}

