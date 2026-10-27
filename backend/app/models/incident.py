from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
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
            default = lambda: datetime.now(timezone.utc),
            nullable = False ) 

    service_name = Column(
    String(100),
    nullable=False,
    default="unknown"
)