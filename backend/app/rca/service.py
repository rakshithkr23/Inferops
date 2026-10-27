
import json
import os
import time

from app.schemas.rca import RCAAnalysis
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError
from app.rag.similarity_search import find_similar_incidents

load_dotenv()

MODEL_NAME = "gemini-3.8-flash"

def analyze_incident(
    incident_type: str,
    service_name: str,
    severity: str,
    description: str,
) -> dict:
    """Analyze an incident using Gemini and historical RAG context."""

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    if not description.strip():
        raise ValueError("Incident description cannot be empty.")

    query = (
        f"Incident type: {incident_type}\n"
        f"Service: {service_name}\n"
        f"Severity: {severity}\n"
        f"Description: {description}"
    )

    # Check the duration of historical incident similarity search.
    similarity_start = time.perf_counter()
    print("[RCA TIMING] Starting similarity search", flush=True)

    similar_incidents = find_similar_incidents(query, limit=3)

    print(
        f"[RCA TIMING] Similarity search finished in "
        f"{time.perf_counter() - similarity_start:.2f} seconds",
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

    prompt = f"""
You are the root-cause analysis assistant for InferOps.

Analyze the current incident using the supplied incident details and
historical incidents. Historical incidents are reference evidence, not
proof that the current incident has the same root cause.

Current incident:
{query}

Relevant historical incidents:
{json.dumps(context, indent=2)}

Return only a valid JSON object with these fields:
{{
  "probable_root_cause": "Likely cause, or state that evidence is insufficient",
  "evidence": ["Evidence supporting the analysis"],
  "recommended_actions": ["Specific diagnostic or corrective action"],
  "confidence": "low, medium, or high",
  "limitations": ["Missing evidence or uncertainty"]
}}

Do not invent logs, metrics, Kubernetes events, or facts.
Distinguish confirmed evidence from hypotheses.
"""

    client = genai.Client(
    api_key=api_key,
    http_options={
        "timeout": 20000,
        "retry_options": {"attempts": 1},
    },
)

    try:
        gemini_start = time.perf_counter()
        print("[RCA TIMING] Starting Gemini request", flush=True)

        # try:
        #     response = client.interactions.create(
        #         model=MODEL_NAME,
        #         input=prompt,
        #     )
        # except APIError as exc:
        #     print(
        #         f"[RCA TIMING] Gemini API failed after "
        #         f"{time.perf_counter() - gemini_start:.2f} seconds",
        #         flush=True,
        #     )
        #     print(
        #         f"[RCA ERROR] {type(exc).__name__}: {exc}",
        #         flush=True,
        #     )
        #     status_code = getattr(exc, "code", None)

        #     raise RuntimeError(
        #         f"Gemini API request failed with status {status_code}."
        #     ) from exc
        try:
            response = client.interactions.create(
                model=MODEL_NAME,
                input=prompt,
            )
        except Exception as exc:
            import traceback

            print(
                f"[RCA ERROR] {type(exc).__name__}: {exc}",
                flush=True,
            )
            traceback.print_exc()
            raise

        print(
            f"[RCA TIMING] Gemini request finished in "
            f"{time.perf_counter() - gemini_start:.2f} seconds",
            flush=True,
        )

        output_text = response.output_text
        if not output_text:
            raise RuntimeError("Gemini returned an empty response.")

        try:
            result = json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned a response that was not valid JSON."
            ) from exc

        try:
            validated_result = RCAAnalysis.model_validate(result)
        except Exception as exc:
            import traceback

            print(
                f"[RCA ERROR] {type(exc).__name__}: {exc}",
                flush=True,
            )
            traceback.print_exc()
            raise

        result = validated_result.model_dump()

        return {
            "incident": {
                "incident_type": incident_type,
                "service_name": service_name,
                "severity": severity,
                "description": description,
            },
            "similar_incidents": context,
            "analysis": result,
            "model": MODEL_NAME,
        }

    finally:
        client.close()
