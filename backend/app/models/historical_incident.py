from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

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
        default=lambda: datetime.now(UTC),
        nullable=False
    )