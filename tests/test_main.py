import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from google.genai.errors import APIError

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
from app.rca.service import MODEL_NAME, analyze_incident  # noqa: E402

client = TestClient(app)  # test FastAPI without starting a server


def test_root_endpoint():
    response = client.get("/")  # calls the root endpoint

    assert response.status_code == 200  # checks that the request succeeds
    assert response.json() == {  # checks that the returned JSON matches
        "project": "InferOps",
        "status": "running",
        "message": "InferOps backend is working",
    }


@pytest.fixture
def mock_rag():
    with patch(
        "app.rca.service.find_similar_incidents",
        return_value=[],
    ) as mocked:
        yield mocked


@pytest.fixture
def mock_gemini():
    with patch("app.rca.service.genai.Client") as mocked_client:
        client = mocked_client.return_value
        client.interactions.create.return_value.output_text = json.dumps({
            "probable_root_cause": "Database connection failure",
            "evidence": ["Connection attempts are failing"],
            "recommended_actions": ["Check database connectivity"],
            "confidence": "medium",
            "limitations": ["Database logs are unavailable"],
        })
        yield mocked_client, client


def call_analyze_incident():
    return analyze_incident(
        incident_type="Database Connection Failure",
        service_name="inferops-backend",
        severity="high",
        description="PostgreSQL connection attempts are failing.",
    )


def test_rca_success(mock_rag, mock_gemini, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    result = call_analyze_incident()

    assert result["analysis"]["confidence"] == "medium"
    assert result["model"] == MODEL_NAME
    mock_rag.assert_called_once()
    mock_gemini[1].close.assert_called_once()


def test_rca_rejects_invalid_json(mock_rag, mock_gemini, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    mock_gemini[1].interactions.create.return_value.output_text = "{bad json"

    with pytest.raises(RuntimeError, match="not valid JSON"):
        call_analyze_incident()

    mock_gemini[1].close.assert_called_once()


def test_rca_rejects_invalid_confidence(mock_rag, mock_gemini, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    mock_gemini[1].interactions.create.return_value.output_text = json.dumps({
        "probable_root_cause": "Database connection failure",
        "evidence": ["Connection attempts are failing"],
        "recommended_actions": ["Check database connectivity"],
        "confidence": "certain",
        "limitations": ["Database logs are unavailable"],
    })

    with pytest.raises(RuntimeError, match="invalid RCA response"):
        call_analyze_incident()

    mock_gemini[1].close.assert_called_once()


def test_rca_handles_gemini_api_error(mock_rag, mock_gemini, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    mock_gemini[1].interactions.create.side_effect = APIError(
        code=503,
        response_json={"error": {"message": "simulated failure"}},
    )

    with pytest.raises(RuntimeError, match="Gemini API request failed"):
        call_analyze_incident()

    mock_gemini[1].close.assert_called_once()


def test_rca_rejects_empty_description(mock_rag, mock_gemini, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    with pytest.raises(ValueError, match="cannot be empty"):
        analyze_incident(
            incident_type="Database Connection Failure",
            service_name="inferops-backend",
            severity="high",
            description="   ",
        )

    mock_gemini[0].assert_not_called()
    mock_rag.assert_not_called()


def test_rca_api_returns_expected_response():
    fake_result = {
        "incident": {
            "incident_type": "Database Connection Failure",
            "service_name": "inferops-backend",
            "severity": "high",
            "description": "PostgreSQL connection attempts are failing.",
        },
        "similar_incidents": [],
        "analysis": {
            "probable_root_cause": "Database connection failure",
            "evidence": ["Connection attempts are failing"],
            "recommended_actions": ["Check database connectivity"],
            "confidence": "medium",
            "limitations": ["Database logs are unavailable"],
        },
        "model": MODEL_NAME,
    }

    payload = {
        "incident_type": "Database Connection Failure",
        "service_name": "inferops-backend",
        "severity": "high",
        "description": "PostgreSQL connection attempts are failing.",
    }

    with patch(
        "app.routes.rca_workflow.invoke",
        return_value={"rca_result": fake_result},
    ) as mocked_workflow:
        response = client.post("/rca/analyze", json=payload)

    assert response.status_code == 200
    assert response.json() == fake_result
    mocked_workflow.assert_called_once()