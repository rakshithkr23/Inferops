from app.database.connection import Base, engine

# Imported for their side effect (table registration), see init_db.py.
from app.models.historical_incident import HistoricalIncident  # noqa: F401
from app.models.incident import Incident  # noqa: F401
from app.rag.embedding_model import IncidentEmbedding


def initialize_embedding_table() -> None:
    Base.metadata.create_all(
        bind=engine,
        tables=[IncidentEmbedding.__table__],
    )
    print("Embedding table initialized successfully.")


if __name__ == "__main__":
    initialize_embedding_table()
