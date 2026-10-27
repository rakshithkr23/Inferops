from app.database.connection import Base, engine
from app.models.incident import Incident
from app.models.historical_incident import HistoricalIncident
from app.rag.embedding_model import IncidentEmbedding


def initialize_embedding_table() -> None:
    Base.metadata.create_all(
        bind=engine,
        tables=[IncidentEmbedding.__table__],
    )
    print("Embedding table initialized successfully.")


if __name__ == "__main__":
    initialize_embedding_table()