
"""Seed demo historical incidents and generate their embeddings.

Safe to run many times: incidents are only inserted when the table is empty,
and embeddings are only created for incidents that do not have one yet.

Run:  python -m app.rag.seed_data
"""
from sqlalchemy import text

from app.database.connection import Base, SessionLocal, engine
from app.models.historical_incident import HistoricalIncident
from app.models.incident import Incident  # noqa: F401  (registers the table)
from app.models.rca_feedback import RCAFeedback  # noqa: F401  (registers the table)
from app.rag.embedding_model import IncidentEmbedding
from app.rag.similarity_search import get_embedding_model
from app.rag.text_builder import build_incident_text

DEMO_INCIDENTS = [
    {
        "incident_type": "Database connectivity",
        "service_name": "payments-api",
        "severity": "high",
        "description": (
            "Payment requests failed with HTTP 500 errors. Application logs "
            "showed 'connection refused' when connecting to PostgreSQL."
        ),
        "root_cause": (
            "The database service had restarted and the application kept "
            "using stale connections because no retry or pool recycle was "
            "configured."
        ),
        "resolution": (
            "Restarted the application pods, enabled connection pool "
            "pre-ping and added retry logic for database connections."
        ),
        "outcome": "Resolved in 25 minutes",
    },
    {
        "incident_type": "High CPU usage",
        "service_name": "orders-api",
        "severity": "high",
        "description": (
            "CPU usage stayed above 95% for ten minutes after a new "
            "deployment and request latency increased sharply."
        ),
        "root_cause": (
            "A new release introduced an unindexed query that ran on every "
            "request and saturated the CPU."
        ),
        "resolution": (
            "Rolled back the deployment, added the missing database index "
            "and redeployed after load testing."
        ),
        "outcome": "Resolved in 40 minutes",
    },
    {
        "incident_type": "Kubernetes pod failure",
        "service_name": "inventory-service",
        "severity": "medium",
        "description": (
            "Pods entered CrashLoopBackOff right after a configuration "
            "change. Container logs showed a missing environment variable."
        ),
        "root_cause": (
            "A required environment variable was removed from the "
            "ConfigMap during a configuration update."
        ),
        "resolution": (
            "Restored the environment variable in the ConfigMap and "
            "restarted the deployment."
        ),
        "outcome": "Resolved in 15 minutes",
    },
]


def seed() -> None:
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(HistoricalIncident).count() == 0:
            for data in DEMO_INCIDENTS:
                db.add(HistoricalIncident(**data))
            db.commit()
            print(f"Inserted {len(DEMO_INCIDENTS)} demo historical incidents.")
        else:
            print("Historical incidents already exist; skipping insert.")

        missing = (
            db.query(HistoricalIncident)
            .outerjoin(
                IncidentEmbedding,
                IncidentEmbedding.historical_incident_id
                == HistoricalIncident.id,
            )
            .filter(IncidentEmbedding.id.is_(None))
            .all()
        )

        if not missing:
            print("All historical incidents already have embeddings.")
            return

        model = get_embedding_model()
        for incident in missing:
            vector = model.encode(
                build_incident_text(incident),
                normalize_embeddings=True,
            ).tolist()
            db.add(
                IncidentEmbedding(
                    historical_incident_id=incident.id,
                    embedding=vector,
                )
            )
        db.commit()
        print(f"Created {len(missing)} embeddings.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

