
from functools import lru_cache

from sentence_transformers import SentenceTransformer
from sqlalchemy import text

from app.database.connection import SessionLocal

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Initial relevance threshold. We can tune this after testing retrieval scores.
DEFAULT_MIN_SIMILARITY = 0.50


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load and reuse the sentence-transformer model."""
    return SentenceTransformer(MODEL_NAME, device="cpu")


def find_similar_incidents(
    query_text: str,
    limit: int = 3,
    min_similarity: float = DEFAULT_MIN_SIMILARITY,
) -> list[dict]:
    """
    Retrieve relevant historical incidents using pgvector cosine similarity.

    Args:
        query_text: Text describing the current incident.
        limit: Maximum number of historical incidents to return.
        min_similarity: Minimum acceptable similarity score (0 to 1).

    Returns:
        A list of relevant historical incidents with similarity scores.
    """

    if not query_text or not query_text.strip():
        raise ValueError("Query text cannot be empty.")

    if limit < 1:
        raise ValueError("Limit must be at least 1.")

    if not 0 <= min_similarity <= 1:
        raise ValueError("Minimum similarity must be between 0 and 1.")

    model = get_embedding_model()

    query_embedding = model.encode(
        query_text,
        normalize_embeddings=True,
    ).tolist()

    embedding_string = "[" + ",".join(
        str(value) for value in query_embedding
    ) + "]"

    db = SessionLocal()

    try:
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
                WHERE
                    1 - (
                        e.embedding <=> CAST(:query_embedding AS vector)
                    ) >= :min_similarity
                ORDER BY
                    e.embedding <=> CAST(:query_embedding AS vector)
                LIMIT :limit
            """),
            {
                "query_embedding": embedding_string,
                "min_similarity": min_similarity,
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
        min_similarity=DEFAULT_MIN_SIMILARITY,
    )

    print("Similar historical incidents:")

    if not matches:
        print(
            "No historical incidents met the minimum similarity "
            f"threshold of {DEFAULT_MIN_SIMILARITY:.2f}."
        )

    for match in matches:
        print(f"\nIncident ID: {match['id']}")
        print(f"Type: {match['incident_type']}")
        print(f"Service: {match['service_name']}")
        print(f"Severity: {match['severity']}")
        print(f"Root cause: {match['root_cause']}")
        print(f"Resolution: {match['resolution']}")
        print(f"Similarity: {float(match['similarity']):.4f}")
