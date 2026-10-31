from app.database.connection import Base, engine
from app.models.historical_incident import HistoricalIncident as HistoricalIncident
from app.models.incident import Incident as Incident
from app.rag.embedding_model import IncidentEmbedding


def initialize_embedding_table() -> None:
    Base.metadata.create_all(
        bind=engine,
        tables=[IncidentEmbedding.__table__],
    )
    print("Embedding table initialized successfully.")


if __name__ == "__main__":
    initialize_embedding_table()
