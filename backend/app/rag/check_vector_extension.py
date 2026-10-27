from sqlalchemy import text

from app.database.connection import engine


def check_vector_extension() -> None:
    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

        result = connection.execute(
            text("""
                SELECT extname, extversion
                FROM pg_extension
                WHERE extname = 'vector'
            """)
        )

        extension = result.fetchone()

        if extension:
            print(f"Extension: {extension.extname}")
            print(f"Version: {extension.extversion}")
        else:
            print("Vector extension was not found.")


if __name__ == "__main__":
    check_vector_extension()
