
"""Health checks for InferOps Service Observatory."""

import importlib.util
import os
from datetime import UTC, datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

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

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def utc_now():
    return datetime.now(UTC).isoformat()


def service_result(
    service_id,
    name,
    status,
    configured,
    message,
    checked_at,
    components=None,
):
    result = {
        "id": service_id,
        "name": name,
        "status": status,
        "configured": configured,
        "message": message,
        "checked_at": checked_at,
    }

    if components is not None:
        result["components"] = components

    return result


def check_provider(url, api_key):
    """Check provider API connectivity without generating AI content."""

    if not api_key:
        return {
            "configured": False,
            "status": "unknown",
            "message": "API key is not configured.",
        }

    request = Request(
        url,
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )

    try:
        with urlopen(request, timeout=5) as response:
            if 200 <= response.status < 300:
                return {
                    "configured": True,
                    "status": "healthy",
                    "message": "Provider API responded successfully.",
                }

            return {
                "configured": True,
                "status": "unhealthy",
                "message": f"Provider returned HTTP {response.status}.",
            }

    except HTTPError as error:
        return {
            "configured": True,
            "status": "unhealthy",
            "message": f"Provider returned HTTP {error.code}. Check API access.",
        }

    except (URLError, TimeoutError, OSError):
        return {
            "configured": True,
            "status": "unhealthy",
            "message": "Provider endpoint could not be reached.",
        }


def check_ai_engine():
    """Check both configured AI providers and describe RCA components."""

    freellm_base_url = os.getenv(
        "FREELLMAPI_BASE_URL",
        "http://host.docker.internal:3001/v1",
    ).rstrip("/")

    freellm_api_key = os.getenv("FREELLMAPI_API_KEY")
    freellm_model = os.getenv("FREELLMAPI_MODEL", "auto:fast")

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

    # FreeLLMAPI is the primary provider.
    freellm = check_provider(
        f"{freellm_base_url}/models",
        freellm_api_key,
    )

    # Gemini is the backup provider.
    gemini_url = (
        "https://generativelanguage.googleapis.com/v1beta/models?"
        + urlencode({"key": gemini_api_key, "pageSize": 1})
    ) if gemini_api_key else ""

    gemini = check_provider(
        gemini_url,
        gemini_api_key,
    )

    components = [
        {
            "id": "freellmapi",
            "name": "FreeLLMAPI",
            "role": "Primary AI provider",
            "model": freellm_model,
            **freellm,
        },
        {
            "id": "gemini",
            "name": "Google Gemini",
            "role": "Backup AI provider",
            "model": gemini_model,
            **gemini,
        },
        {
            "id": "embedding",
            "name": "Sentence Transformers",
            "role": "Local embedding model",
            "model": EMBEDDING_MODEL,
            "configured": True,
            "status": "configured",
            "message": (
                "Configured to load locally on CPU when RCA retrieval "
                "is first requested."
            ),
        },
        {
            "id": "rag",
            "name": "RAG + pgvector",
            "role": "Historical incident retrieval",
            "model": "384-dimensional embeddings",
            "configured": True,
            "status": "configured",
            "message": (
                "Retrieves similar historical incidents from PostgreSQL "
                "using vector similarity search."
            ),
        },
        {
            "id": "langgraph",
            "name": "LangGraph",
            "role": "RCA workflow",
            "model": "InferOps RCA workflow",
            "configured": importlib.util.find_spec("langgraph") is not None,
            "status": (
                "configured"
                if importlib.util.find_spec("langgraph") is not None
                else "unhealthy"
            ),
            "message": (
                "Manages the root cause analysis workflow."
                if importlib.util.find_spec("langgraph") is not None
                else "LangGraph package is not installed."
            ),
        },
    ]

    # Engine health is based on the primary provider's live response.
    if freellm["status"] == "healthy":
        engine_status = "healthy"
        engine_message = "Primary AI provider is reachable."
    elif freellm["configured"]:
        engine_status = "unhealthy"
        engine_message = "Primary AI provider is not reachable."
    else:
        engine_status = "unknown"
        engine_message = "Primary AI provider is not configured."

    return service_result(
        "ai",
        "AI Analysis Engine",
        engine_status,
        freellm["configured"] or gemini["configured"],
        engine_message,
        utc_now(),
        components,
    )


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

    # AI Engine: check both providers independently.
    results.append(check_ai_engine())

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
