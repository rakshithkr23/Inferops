
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)

from app.database.connection import Base


class RCARecord(Base):
    __tablename__ = "rca_records"

    id = Column(Integer, primary_key=True, index=True)

    rca_id = Column(
        String(36),
        nullable=False,
        unique=True,
        index=True,
    )

    # Original incident submitted by the user
    incident_type = Column(String(100), nullable=False)
    service_name = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)

    # Successfully generated RCA analysis
    probable_root_cause = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False)
    recommended_actions = Column(JSON, nullable=False)
    confidence = Column(String(20), nullable=False)
    limitations = Column(JSON, nullable=False)

    model = Column(String(150), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )
