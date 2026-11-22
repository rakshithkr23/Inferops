
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class RCARecordResponse(BaseModel):
    id: int
    rca_id: str
    incident_type: str
    service_name: str
    severity: str
    description: str
    probable_root_cause: str
    evidence: Any
    recommended_actions: Any
    confidence: str
    limitations: Any
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

