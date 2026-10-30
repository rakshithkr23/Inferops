from functools import lru_cache

from sentence_transformers import SentenceTransformer
from sqlalchemy import text

from app.database.connection import SessionLocal

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(MODEL_NAME, device="cpu")

def find_similar_incidents(
    query_text: str,
    limit: int = 3,
) -> list[dict]:
    if not query_text.strip():
        raise ValueError("Query text cannot be empty.")

    if limit < 1:
        raise ValueError("Limit must be at least 1.")

    #model = SentenceTransformer(MODEL_NAME, device="cpu")
    model = get_embedding_model()
    query_embedding = model.encode(
        query_text,
        normalize_embeddings=True,
    ).tolist()

    db = SessionLocal()

    try:
        embedding_string = "[" + ",".join(
            str(value) for value in query_embedding
        ) + "]"
        results = db.execute(
            text("""
                SELECT
                    h.id,
                    h.incident_type,
                    h.service_name,
                    h.severity,
                    h.description,
                    h.root_cause,
                    h.resolution,
                    1 - (e.embedding <=> CAST(:query_embedding AS vector))
                        AS similarity
                FROM incident_embeddings AS e
                JOIN historical_incidents AS h
                    ON h.id = e.historical_incident_id
                ORDER BY e.embedding <=> CAST(:query_embedding AS vector)
                LIMIT :limit
            """),
            {
                "query_embedding": embedding_string,
                "limit": limit,
            },
        ).mappings().all()

        return [dict(row) for row in results]
    finally:
        db.close()

if __name__ == "__main__":
    matches = find_similar_incidents(
        "The payment service cannot connect to its database.",
        limit=3,
    )

    print("Similar historical incidents:")

    for match in matches:
        print(f"\nIncident ID: {match['id']}")
        print(f"Type: {match['incident_type']}")
        print(f"Service: {match['service_name']}")
        print(f"Root cause: {match['root_cause']}")
        print(f"Similarity: {float(match['similarity']):.4f}")