from pydantic import BaseModel


class HistoricalIncidentCreate(BaseModel):
    incident_type: str
    service_name: str
    severity: str
    description: str
    root_cause: str
    resolution: str
    outcome: str | None = None