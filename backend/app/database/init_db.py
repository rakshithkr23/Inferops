from app.database.connection import Base, engine
from app.models.historical_incident import HistoricalIncident as HistoricalIncident
from app.models.incident import Incident as Incident
from app.models.rca_feedback import RCAFeedback as RCAFeedback

Base.metadata.create_all(bind=engine)

print("DATABASE TABLES CREATED SUCCESSFULLY")
