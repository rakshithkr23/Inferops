from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database.connection import Base

class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(Integer, primary_key=True, index=True)

    incident_type = Column(String(100), nullable=False)
    service_name = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)

    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    outcome = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )