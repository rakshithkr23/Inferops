from app.database.connection import Base, engine
from app.models.incident import Incident
from app.rag.embedding_model import IncidentEmbedding
from app.models.historical_incident import HistoricalIncident


def inspect_database() -> None:
    print("Database dialect:", engine.dialect.name)
    print("Database driver:", engine.dialect.driver)

    print("\nRegistered SQLAlchemy tables:")
    for table_name in Base.metadata.tables:
        print(f"- {table_name}")

    print(
    "Embedding table registered:",
    IncidentEmbedding.__tablename__ in Base.metadata.tables,
)

    print("\nHistorical incident table registered:",
          HistoricalIncident.__tablename__ in Base.metadata.tables)

    print("Incident table registered:",
          Incident.__tablename__ in Base.metadata.tables)


if __name__ == "__main__":
    inspect_database()