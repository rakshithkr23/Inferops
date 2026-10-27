from pgvector.sqlalchemy import Vector


def check_vector_package() -> None:
    vector_type = Vector(384)
    print("pgvector Python package is available.")
    print("Embedding dimensions:", vector_type.dim)


if __name__ == "__main__":
    check_vector_package()