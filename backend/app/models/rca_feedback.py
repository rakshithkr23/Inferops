from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.database.connection import Base


class RCAFeedback(Base):
    __tablename__ = "rca_feedback"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(
        Integer,
        ForeignKey("incidents.id"),
        nullable=True,
    )
    rca_id = Column(String(36), nullable=False)
    feedback_type = Column(String(10), nullable=False)

    rating = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
