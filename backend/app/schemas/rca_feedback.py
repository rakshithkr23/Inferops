
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RCAFeedbackCreate(BaseModel):
    incident_id: int | None = None
    rca_id: str = Field(..., min_length=1, max_length=36)
    feedback_type: Literal["positive", "negative"]

    # Optional fields for the separate five-star feedback form
    rating: int | None = Field(default=None, ge=1, le=5)
    category: str | None = Field(default=None, max_length=50)
    comments: str | None = Field(default=None, max_length=2000)


class RCAFeedbackResponse(BaseModel):
    id: int
    incident_id: int | None
    rca_id: str
    feedback_type: Literal["positive", "negative"]
    rating: int | None
    category: str | None
    comments: str | None
    created_at: datetime
