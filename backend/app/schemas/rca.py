
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class RCARequest(BaseModel):
    incident_type: str = Field(..., min_length=1)
    service_name: str = Field(..., min_length=1)
    severity: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)

class RCAAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    probable_root_cause: str = Field(..., min_length=1)
    evidence: list[str]
    recommended_actions: list[str]
    confidence: Literal["low", "medium", "high"]
    limitations: list[str]

class RCAResponse(BaseModel):
    rca_id: str
    incident: dict
    similar_incidents: list[dict]
    analysis: RCAAnalysis
    model: str
