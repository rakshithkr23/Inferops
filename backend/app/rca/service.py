
import json
import logging
import os
import time
import urllib.request

from dotenv import load_dotenv
from google import genai

from app.rag.similarity_search import (
    DEFAULT_MIN_SIMILARITY,
    find_similar_incidents,
)
from app.schemas.rca import RCAAnalysis

load_dotenv()
logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()


class RCAServiceError(RuntimeError):
    """An RCA failure with a known HTTP status and safe public message."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.public_message = message


def _normalize_and_validate(output_text: str) -> dict:
    """Normalize provider output and validate it against the RCA schema."""

    if not output_text:
        raise ValueError("The AI provider returned an empty response.")

    output_text = output_text.strip()

    if output_text.startswith("```"):
        output_text = output_text.split("\n", 1)[-1].strip()

        if output_text.endswith("```"):
            output_text = output_text[:-3].strip()

    result = json.loads(output_text)

    confidence = result.get("confidence")

    if isinstance(confidence, (int, float)) and not isinstance(confidence, bool):
        result["confidence"] = (
            "high" if confidence >= 0.8
            else "medium" if confidence >= 0.5
            else "low"
        )
    elif isinstance(confidence, str):
        result["confidence"] = confidence.strip().lower()

    for field in ("evidence", "recommended_actions", "limitations"):
        if isinstance(result.get(field), str):
            result[field] = [result[field]]

    validated = RCAAnalysis.model_validate(result)
    return validated.model_dump()


def _call_freellmapi(prompt: str) -> tuple[dict, str]:
    """Generate RCA using the FreeLLMAPI unified endpoint."""

    base_url = os.getenv(
        "FREELLMAPI_BASE_URL",
        "http://host.docker.internal:3001/v1",
    ).rstrip("/")

    api_key = os.getenv("FREELLMAPI_API_KEY")
    model = os.getenv("FREELLMAPI_MODEL", "auto:fast")

    if not api_key:
        raise RuntimeError("FREELLMAPI_API_KEY is not configured.")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are InferOps RCA. Return only valid JSON. "
                    "Confidence must be low, medium, or high. "
                    "Do not invent evidence."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    request = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    start = time.perf_counter()

    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    output_text = data["choices"][0]["message"]["content"]
    analysis = _normalize_and_validate(output_text)
    actual_model = data.get("model") or model

    print(
        f"[RCA TIMING] FreeLLMAPI completed in "
        f"{time.perf_counter() - start:.2f} seconds",
        flush=True,
    )
    print(f"[RCA PROVIDER] FreeLLMAPI model: {actual_model}", flush=True)

    return analysis, actual_model


def _call_gemini(prompt: str) -> tuple[dict, str]:
    """Generate RCA using Gemini as a time-limited backup."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    client = genai.Client(
        api_key=api_key,
        http_options={
            "timeout": 15000,
            "retry_options": {"attempts": 1},
        },
    )

    start = time.perf_counter()

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        analysis = _normalize_and_validate(response.text or "")

        print(
            f"[RCA TIMING] Gemini completed in "
            f"{time.perf_counter() - start:.2f} seconds",
            flush=True,
        )

        print(f"[RCA PROVIDER] Gemini model: {MODEL_NAME}", flush=True)

        return analysis, MODEL_NAME

    finally:
        client.close()


def analyze_incident(
    incident_type: str,
    service_name: str,
    severity: str,
    description: str,
) -> dict:
    """Analyze an incident using FreeLLMAPI, Gemini backup, and RAG context."""

    if not description or not description.strip():
        raise ValueError("Incident description cannot be empty.")

    query = (
        f"Incident type: {incident_type}\n"
        f"Service: {service_name}\n"
        f"Severity: {severity}\n"
        f"Description: {description}"
    )

    # Retrieve relevant historical incidents using the existing RAG search.
    similarity_start = time.perf_counter()

    print("[RCA TIMING] Starting similarity search", flush=True)

    retrieval_failed = False

    try:
        similar_incidents = find_similar_incidents(
            query,
            limit=3,
            min_similarity=DEFAULT_MIN_SIMILARITY,
        )
    except Exception:
        logger.exception(
            "RCA similarity search failed; continuing without historical context"
        )
        similar_incidents = []
        retrieval_failed = True

    print(
        f"[RCA TIMING] Similarity search finished in "
        f"{time.perf_counter() - similarity_start:.2f} seconds",
        flush=True,
    )

    print(
        f"[RCA RAG] Retrieved {len(similar_incidents)} relevant incidents "
        f"with minimum similarity {DEFAULT_MIN_SIMILARITY:.2f}",
        flush=True,
    )

    context = [
        {
            "incident_type": item["incident_type"],
            "service_name": item["service_name"],
            "severity": item["severity"],
            "description": item["description"],
            "root_cause": item["root_cause"],
            "resolution": item["resolution"],
            "similarity": float(item["similarity"]),
        }
        for item in similar_incidents
    ]

    if context:
        historical_context = json.dumps(context, indent=2)
    elif retrieval_failed:
        historical_context = (
            "Historical incident retrieval failed. Do not assume "
            "a historical root cause applies to this incident."
        )
    else:
        historical_context = (
            "No historical incidents met the minimum similarity threshold. "
            "Do not assume a historical root cause applies to this incident."
        )

    prompt = f"""
You are the root-cause analysis assistant for InferOps.

Analyze the current incident using the supplied incident details
and relevant historical incidents.

Historical incidents are reference evidence, not proof that the
current incident has the same root cause.

Current incident:
{query}

Relevant historical incidents:
{historical_context}

Return only a valid JSON object with these fields:
{{
  "probable_root_cause": "Likely cause, or state that evidence is insufficient",
  "evidence": ["Evidence supporting the analysis"],
  "recommended_actions": ["Specific diagnostic or corrective action"],
  "confidence": "low, medium, or high",
  "limitations": ["Missing evidence or uncertainty"]
}}

Do not invent logs, metrics, Kubernetes events, or facts.

If no relevant historical incidents are available, mention this
limitation and base your analysis only on the current incident details.

Distinguish confirmed evidence from hypotheses.
"""

    # Primary provider: FreeLLMAPI.
    try:
        print("[RCA PROVIDER] Trying FreeLLMAPI primary", flush=True)
        analysis, actual_model = _call_freellmapi(prompt)

    except Exception:
        logger.exception(
            "FreeLLMAPI failed. Attempting Gemini backup."
        )

        # Backup provider: Gemini.
        try:
            print("[RCA PROVIDER] Trying Gemini backup", flush=True)
            analysis, actual_model = _call_gemini(prompt)

        except Exception as gemini_error:
            logger.exception("Gemini backup provider also failed.")

            raise RCAServiceError(
                502,
                "RCA providers are temporarily unavailable. "
                "Please try again shortly.",
            ) from gemini_error

    return {
        "incident": {
            "incident_type": incident_type,
            "service_name": service_name,
            "severity": severity,
            "description": description,
        },
        "similar_incidents": context,
        "analysis": analysis,
        "model": actual_model,
    }
