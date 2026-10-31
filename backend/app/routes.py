
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.detection.engine import detect_incidents
from app.models.historical_incident import HistoricalIncident
from app.models.incident import Incident
from app.models.rca_feedback import RCAFeedback
from app.rag.similarity_search import find_similar_incidents
from app.rca.workflow import rca_workflow
from app.schemas.historical_incident import HistoricalIncidentCreate
from app.schemas.incident import IncidentCreate
from app.schemas.rag import RAGSearchRequest, RAGSearchResponse
from app.schemas.rca import RCARequest, RCAResponse
from app.schemas.rca_feedback import RCAFeedbackCreate, RCAFeedbackResponse

router = APIRouter()

@router.post("/incidents")
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        title=incident.title,
        service_name=incident.service_name,
        type=incident.type,
        severity=incident.severity,
        description=incident.description
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    return new_incident


@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    try:
        incidents = db.query(Incident).all()
        return incidents
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve incidents from the database."
        )

@router.post("/detect-incidents")
def run_incident_detection(
    status_code: int | None = None,
    error_rate_percent: float | None = None,
    total_requests: int = 0,
    error_message: str | None = None,
    pod_status: str | None = None,
    restart_count: int = 0,
    db: Session = Depends(get_db),
):
    detected_incidents = detect_incidents(
        status_code=status_code,
        error_rate_percent=error_rate_percent,
        total_requests=total_requests,
        error_message=error_message,
        pod_status=pod_status,
        restart_count=restart_count,
    )

    saved_incidents = []

    try:
        for detected in detected_incidents:
            new_incident = Incident(
                title=detected["type"],
                service_name="inferops-demo",
                type=detected["type"],
                severity=detected["severity"],
                description=detected["description"],
            )

            db.add(new_incident)
            saved_incidents.append(new_incident)

        if saved_incidents:
            db.commit()

            for incident in saved_incidents:
                db.refresh(incident)

    except Exception:
        db.rollback()
        raise

    return saved_incidents

@router.post("/historical-incidents")
def create_historical_incident(
    incident: HistoricalIncidentCreate,
    db: Session = Depends(get_db)
):
    new_incident = HistoricalIncident(
        incident_type=incident.incident_type,
        service_name=incident.service_name,
        severity=incident.severity,
        description=incident.description,
        root_cause=incident.root_cause,
        resolution=incident.resolution,
        outcome=incident.outcome
    )

    try:
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        return new_incident
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to save historical incident."
        )


@router.get("/historical-incidents")
def get_historical_incidents(
    db: Session = Depends(get_db)
):
    try:
        return db.query(HistoricalIncident).order_by(
            HistoricalIncident.id.desc()
        ).all()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve historical incidents."
        )


@router.get("/incidents/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(
        Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident

@router.post("/rag/search", response_model=RAGSearchResponse)
def search_similar_historical_incidents(
    request: RAGSearchRequest,
):
    try:
        results = find_similar_incidents(
            query_text=request.query,
            limit=request.limit,
        )

        return {
            "query": request.query,
            "results": results,
            "total_results": len(results),
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to search historical incidents.",
        ) from exc

@router.post("/rca/analyze", response_model=RCAResponse)
def analyze_incident_rca(request: RCARequest):
    try:
        result = rca_workflow.invoke({
            "incident_type": request.incident_type,
            "service_name": request.service_name,
            "severity": request.severity,
            "description": request.description,
        })

        rca_result = result["rca_result"]
        rca_result["rca_id"] = str(uuid4())

        return rca_result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        error_message = str(exc)
        cause_message = str(exc.__cause__) if exc.__cause__ else ""
        combined_error = f"{error_message} {cause_message}".lower()

        if (
            "429" in combined_error
            or "rate limit" in combined_error
            or "resource_exhausted" in combined_error
        ):
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini API quota exceeded. Please wait for the quota "
                    "to reset or check your Gemini API limits."
                ),
            ) from exc

        raise HTTPException(
            status_code=500,
            detail="Failed to analyze the incident.",
        ) from exc

@router.post("/rca/feedback", response_model=RCAFeedbackResponse)
def create_rca_feedback(
    feedback: RCAFeedbackCreate,
    db: Session = Depends(get_db),
):
    try:
        if feedback.incident_id is not None:
            incident = db.query(Incident).filter(
                Incident.id == feedback.incident_id
            ).first()

            if incident is None:
                raise HTTPException(
                    status_code=404,
                    detail="Incident not found.",
                )

        new_feedback = RCAFeedback(
            incident_id=feedback.incident_id,
            rca_id=feedback.rca_id,
            feedback_type=feedback.feedback_type,
            rating=feedback.rating,
            category=feedback.category,
            comments=feedback.comments,
        )

        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)

        return new_feedback

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        error_message = str(exc)
        cause_message = str(exc.__cause__) if exc.__cause__ else ""
        combined_error = f"{error_message} {cause_message}".lower()

        if "timed out" in combined_error or "timeout" in combined_error:
            raise HTTPException(
                status_code=504,
                detail="Failed to save RCA feedback.",
            ) from exc

        raise HTTPException(
            status_code=500,
            detail="Failed to save RCA feedback.",
        ) from exc