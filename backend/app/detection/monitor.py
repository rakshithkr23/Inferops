import asyncio
import logging
import os

import httpx
from app.database.connection import SessionLocal
from app.detection.engine import detect_incidents
from app.models.incident import Incident

logger = logging.getLogger(__name__)

METRICS_URL = os.getenv(
    "DEMO_METRICS_URL",
    "http://host.docker.internal:8001/metrics",
)
SYSTEM_METRICS_URL = os.getenv(
    "DEMO_SYSTEM_METRICS_URL",
    "http://host.docker.internal:8001/system/metrics",
)
POLL_INTERVAL = int(os.getenv("DETECTION_POLL_INTERVAL", "30"))


def process_metrics(metrics: dict) -> list[dict]:
    """Run existing detection rules using demo application metrics."""
    total_requests = metrics.get("total_requests", 0)
    error_rate = metrics.get("error_rate_percent", 0.0)

    detected = detect_incidents(
        error_rate_percent=error_rate,
        total_requests=total_requests,
        cpu_usage_percent=metrics.get("cpu_usage_percent", 0.0),
        memory_usage_percent=metrics.get("memory_usage_percent", 0.0),
    )

    saved_incidents = []
    db = SessionLocal()

    try:
        for item in detected:
            existing = db.query(Incident).filter(
                Incident.type == item["type"],
                Incident.service_name == "inferops-demo",
                Incident.status == "OPEN",
            ).first()

            if existing:
                continue

            incident = Incident(
                title=item["type"],
                service_name="inferops-demo",
                type=item["type"],
                severity=item["severity"],
                description=item["description"],
            )

            db.add(incident)
            saved_incidents.append(incident)

        if saved_incidents:
            db.commit()

            for incident in saved_incidents:
                db.refresh(incident)

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return [
        {
            "id": incident.id,
            "type": incident.type,
            "severity": incident.severity,
        }
        for incident in saved_incidents
    ]

async def monitor_demo_metrics():
    """Poll application and system metrics for automatic incident detection."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                response = await client.get(METRICS_URL)
                response.raise_for_status()
                metrics = response.json()

                system_response = await client.get(SYSTEM_METRICS_URL)
                system_response.raise_for_status()
                system_metrics = system_response.json()

                metrics.update(system_metrics)

                saved = process_metrics(metrics)

                if saved:
                    logger.warning(
                        "Automatically generated incidents: %s",
                        saved,
                    )

            except Exception:
                logger.exception(
                    "Automatic incident detection cycle failed."
                )

            await asyncio.sleep(POLL_INTERVAL)