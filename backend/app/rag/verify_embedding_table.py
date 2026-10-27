from sqlalchemy import text

from app.database.connection import engine


def verify_embedding_table() -> None:
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_name = 'incident_embeddings'
                ORDER BY ordinal_position
            """)
        )

        columns = result.fetchall()

        if not columns:
            print("Embedding table was not found.")
            return

        print("incident_embeddings table columns:")
        for column in columns:
            print(
                f"Column: {column.column_name}, "
                f"Type: {column.data_type}, "
                f"Database type: {column.udt_name}"
            )


if __name__ == "__main__":
    verify_embedding_table()