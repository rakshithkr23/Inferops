from sqlalchemy import Column, ForeignKey, Integer
from pgvector.sqlalchemy import Vector

from app.database.connection import Base


class IncidentEmbedding(Base):
    __tablename__ = "incident_embeddings"

    id = Column(Integer, primary_key=True, index=True)

    historical_incident_id = Column(
        Integer,
        ForeignKey("historical_incidents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    embedding = Column(Vector(384), nullable=False)