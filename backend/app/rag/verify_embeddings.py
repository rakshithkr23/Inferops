from sqlalchemy import func

from app.database.connection import SessionLocal
from app.models.historical_incident import HistoricalIncident
from app.rag.embedding_model import IncidentEmbedding

def verify_embeddings() -> None:
    db = SessionLocal()

    try:
        incident_count = db.query(HistoricalIncident).count()
        embedding_count = db.query(IncidentEmbedding).count()

        print(f"Historical incidents: {incident_count}")
        print(f"Stored embeddings: {embedding_count}")

        records = (
            db.query(
                IncidentEmbedding.historical_incident_id,
                func.vector_dims(IncidentEmbedding.embedding).label(
                    "dimensions"
                ),
            )
            .order_by(IncidentEmbedding.historical_incident_id)
            .all()
        )
        print("\nStored embedding details:")

        for record in records:
            print(
                f"Incident ID: {record.historical_incident_id}, "
                f"Dimensions: {record.dimensions}"  )
        if incident_count == 3 and embedding_count == 3:
            if all(record.dimensions == 384 for record in records):
                print("\nVerification passed: all 3 embeddings are stored.")
            else:
                print("\nVerification failed: incorrect vector dimensions.")
        else:
            print("\nVerification failed: incident and embedding counts differ.")
    finally:
        db.close()

if __name__ == "__main__":
    verify_embeddings()