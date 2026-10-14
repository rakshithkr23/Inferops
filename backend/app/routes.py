from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate

router = APIRouter()


@router.post("/incidents")
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        title=incident.title,
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
    incidents = db.query(Incident).all()
    return incidents

@router.get("/incidents/{incident_id}")
def get_incident(
    incident_id : int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(
        Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
                status_code = 404,
                detail = "Incident not found")

    return incident

