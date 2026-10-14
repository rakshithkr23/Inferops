from pydantic import BaseModel

class IncidentCreate(BaseModel):
    title: str
    type: str
    severity: str
    description :str | None = None 
