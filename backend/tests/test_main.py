
import json
from unittest.mock import patch

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from app.auth import get_current_user
from app.main import app
from app.database.dependencies import get_db
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

    class FakeDB:
        def __init__(self):
            self.added_records = []
            self.committed = False
            self.rolled_back = False

        def add(self, record):
            self.added_records.append(record)

        def commit(self):
            self.committed = True

        def refresh(self, record):
            pass

        def rollback(self):
            self.rolled_back = True

    fake_db = FakeDB()

    app.dependency_overrides[get_current_user] = lambda: None
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        with patch(
            "app.routes.rca_workflow.invoke",
            return_value={"rca_result": fake_result},
        ) as mocked_workflow:
            response = client.post(
                "/rca/analyze",
                json=INCIDENT,
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200

    response_data = response.json()

    assert response_data["rca_id"]
    assert response_data["incident"] == INCIDENT
    assert response_data["analysis"] == VALID_ANALYSIS
    assert response_data["model"] == "test-model"

    mocked_workflow.assert_called_once()

    # Verify that the successful RCA was saved.
    assert len(fake_db.added_records) == 1
    assert fake_db.committed is True

    saved_record = fake_db.added_records[0]

    assert saved_record.rca_id == response_data["rca_id"]
    assert saved_record.incident_type == INCIDENT["incident_type"]
    assert saved_record.service_name == INCIDENT["service_name"]
    assert saved_record.severity == INCIDENT["severity"]
    assert saved_record.description == INCIDENT["description"]
    assert saved_record.probable_root_cause == (
        VALID_ANALYSIS["probable_root_cause"]
    )
    assert saved_record.model == "test-model"


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


def test_recent_rca_api_returns_five_records_newest_first():
    now = datetime.now(UTC)

    fake_records = [
        SimpleNamespace(
            id=i,
            rca_id=f"test-rca-{i}",
            incident_type="Database Connection Failure",
            service_name="inferops-backend",
            severity="high",
            description=f"Test incident {i}",
            probable_root_cause="Database connection failure",
            evidence=["Connection attempts failed"],
            recommended_actions=["Check database connectivity"],
            confidence="medium",
            limitations=["Database logs unavailable"],
            created_at=now - timedelta(minutes=i),
        )
        for i in range(1, 6)
    ]

    class FakeDB:
        pass

    fake_db = FakeDB()

    app.dependency_overrides[get_current_user] = lambda: None
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        with patch(
            "app.routes.get_recent_rca_records",
            return_value=fake_records,
        ) as mocked_service:
            response = client.get("/rca/recent")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 5
    assert data[0]["rca_id"] == "test-rca-1"
    assert data[4]["rca_id"] == "test-rca-5"

    assert data[0]["evidence"] == [
        "Connection attempts failed"
    ]
    assert data[0]["recommended_actions"] == [
        "Check database connectivity"
    ]
    assert data[0]["confidence"] == "medium"

    mocked_service.assert_called_once_with(fake_db, limit=5)


def test_recent_rca_api_handles_database_error():
    class FakeDB:
        def rollback(self):
            self.rolled_back = True

    fake_db = FakeDB()

    app.dependency_overrides[get_current_user] = lambda: None
    app.dependency_overrides[get_db] = lambda: fake_db

    try:
        with patch(
            "app.routes.get_recent_rca_records",
            side_effect=Exception("Database unavailable"),
        ):
            response = client.get("/rca/recent")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 500
    assert response.json()["detail"] == (
        "Failed to retrieve recent RCA records."
    )
    assert fake_db.rolled_back is True

