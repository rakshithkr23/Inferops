
"""Health checks for InferOps Service Observatory."""

import os
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.auth import get_current_user
from app.database.connection import engine

router = APIRouter(
    prefix="/services",
    tags=["services"],
    dependencies=[Depends(get_current_user)],
)


def utc_now():
    return datetime.now(UTC).isoformat()


def service_result(
    service_id,
    name,
    status,
    configured,
    message,
    checked_at,
):
    return {
        "id": service_id,
        "name": name,
        "status": status,
        "configured": configured,
        "message": message,
        "checked_at": checked_at,
    }


@router.get("/health")
def get_services_health():
    results = []

    # Backend: this endpoint is responding.
    results.append(
        service_result(
            "backend",
            "InferOps Backend",
            "healthy",
            True,
            "InferOps API is responding.",
            utc_now(),
        )
    )

    # PostgreSQL: perform an actual database query.
    database_configured = bool(os.getenv("DATABASE_URL"))

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        results.append(
            service_result(
                "database",
                "PostgreSQL",
                "healthy",
                database_configured,
                "PostgreSQL accepted a test query.",
                utc_now(),
            )
        )

    except SQLAlchemyError:
        results.append(
            service_result(
                "database",
                "PostgreSQL",
                "unhealthy",
                database_configured,
                "PostgreSQL did not respond to the test query.",
                utc_now(),
            )
        )

    # Gemini: configuration check only, not a live API test.
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))

    results.append(
        service_result(
            "ai",
            "AI Analysis Engine",
            "unknown",
            gemini_configured,
            (
                "Gemini API key is configured; live API connectivity "
                "has not been tested."
                if gemini_configured
                else "GEMINI_API_KEY is not configured."
            ),
            utc_now(),
        )
    )

    # Kubernetes: do not assume cluster health from manifests.
    kubernetes_configured = bool(
        os.getenv("KUBERNETES_SERVICE_HOST")
        or os.getenv("KUBECONFIG")
    )

    results.append(
        service_result(
            "kubernetes",
            "Kubernetes",
            "unknown",
            kubernetes_configured,
            (
                "Kubernetes access appears configured, but live "
                "cluster health has not been tested."
                if kubernetes_configured
                else "Kubernetes access is not configured for this backend."
            ),
            utc_now(),
        )
    )

    return {
        "monitoring": "connected",
        "checked_at": utc_now(),
        "registered_services": len(results),
        "configured_components": sum(
            item["configured"] for item in results
        ),
        "services": results,
    }

