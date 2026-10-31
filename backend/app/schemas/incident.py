from pydantic import BaseModel


class IncidentCreate(BaseModel):
    title: str
    type: str
    severity: str
    service_name: str = "unknown"
    description :str | None = None 
