
import json
from unittest.mock import patch

import pytest
from app.auth import get_current_user
from app.main import app
from app.rca.service import (
    RCAServiceError,
    _normalize_and_validate,
    analyze_incident,
)
from fastapi.testclient import TestClient
from pydantic import ValidationError

client = TestClient(app)

VALID_ANALYSIS = {
    "probable_root_cause": "Database connection failure",
    "evidence": ["Connection attempts are failing"],
    "recommended_actions": ["Check database connectivity"],
    "confidence": "medium",
    "limitations": ["Database logs are unavailable"],
}

INCIDENT = {
    "incident_type": "Database Connection Failure",
    "service_name": "inferops-backend",
    "severity": "high",
    "description": "PostgreSQL connection attempts are failing.",
}


def call_analyze_incident():
    return analyze_incident(**INCIDENT)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
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
def mock_freellmapi():
    with patch(
        "app.rca.service._call_freellmapi",
        return_value=(VALID_ANALYSIS.copy(), "test-model"),
    ) as mocked:
        yield mocked


@pytest.fixture
def mock_gemini():
    with patch(
        "app.rca.service._call_gemini",
        return_value=(VALID_ANALYSIS.copy(), "test-gemini-model"),
    ) as mocked:
        yield mocked


def test_rca_success(mock_rag, mock_freellmapi, mock_gemini):
    result = call_analyze_incident()

    assert result["analysis"]["confidence"] == "medium"
    assert result["model"] == "test-model"
    mock_rag.assert_called_once()
    mock_freellmapi.assert_called_once()
    mock_gemini.assert_not_called()


def test_rca_rejects_invalid_json():
    with pytest.raises(json.JSONDecodeError):
        _normalize_and_validate("{bad json")


def test_rca_rejects_invalid_confidence():
    invalid_analysis = VALID_ANALYSIS.copy()
    invalid_analysis["confidence"] = "certain"

    with pytest.raises(ValidationError):
        _normalize_and_validate(json.dumps(invalid_analysis))


def test_rca_handles_gemini_api_error(mock_rag, mock_freellmapi, mock_gemini):
    mock_freellmapi.side_effect = RuntimeError("simulated primary failure")
    mock_gemini.side_effect = RuntimeError("simulated Gemini failure")

    with pytest.raises(
        RCAServiceError,
        match="RCA providers are temporarily unavailable",
    ) as error:
        call_analyze_incident()

    assert error.value.status_code == 502
    mock_rag.assert_called_once()
    mock_freellmapi.assert_called_once()
    mock_gemini.assert_called_once()


def test_rca_rejects_empty_description(mock_rag, mock_freellmapi, mock_gemini):
    with pytest.raises(ValueError, match="cannot be empty"):
        analyze_incident(
            incident_type="Database Connection Failure",
            service_name="inferops-backend",
            severity="high",
            description="   ",
        )

    mock_freellmapi.assert_not_called()
    mock_gemini.assert_not_called()
    mock_rag.assert_not_called()


def test_rca_api_returns_expected_response():
    fake_result = {
        "incident": INCIDENT.copy(),
        "similar_incidents": [],
        "analysis": VALID_ANALYSIS.copy(),
        "model": "test-model",
    }

    payload = INCIDENT.copy()

    app.dependency_overrides[get_current_user] = lambda: None

    try:
        with patch(
            "app.routes.rca_workflow.invoke",
            return_value={"rca_result": fake_result},
        ) as mocked_workflow:
            response = client.post("/rca/analyze", json=payload)
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json() == fake_result
    mocked_workflow.assert_called_once()


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rca_falls_back_to_gemini(mock_rag, mock_freellmapi, mock_gemini):
    mock_freellmapi.side_effect = RuntimeError("simulated primary failure")

    result = call_analyze_incident()

    assert result["analysis"]["confidence"] == "medium"
    assert result["model"] == "test-gemini-model"
    mock_rag.assert_called_once()
    mock_freellmapi.assert_called_once()
    mock_gemini.assert_called_once()
