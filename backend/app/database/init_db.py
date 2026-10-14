from app.database.connection import engine, Base
from app.models.incident import Incident

Base.metadata.create_all(bind=engine)

print("DATABASE TABLES CREATED SUCCESSFULLY")
