from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database.connection import Base


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key = True, index = True)
    title = Column(String(200), nullable = False)
    type = Column(String(50), nullable = False)
    severity = Column(String(20), nullable = False,default = "unknown")
    status =  Column(String(20), nullable = False, default = "OPEN")
    description = Column(Text, nullable = True)

    created_at = Column(
            DateTime(timezone = True),
            default = lambda: datetime.now(UTC),
            nullable = False ) 

    service_name = Column(
    String(100),
    nullable=False,
    default="unknown"
)