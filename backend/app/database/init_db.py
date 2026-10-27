from app.database.connection import engine, Base
from app.models.incident import Incident
from app.models.historical_incident import HistoricalIncident
from app.models.rca_feedback import RCAFeedback

Base.metadata.create_all(bind=engine)

print("DATABASE TABLES CREATED SUCCESSFULLY")
