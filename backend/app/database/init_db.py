
from app.database.connection import Base, engine

# These imports are required for their side effect: importing a model registers
# its table on Base.metadata, which create_all() below uses. Do not remove them.
from app.models.historical_incident import HistoricalIncident  # noqa: F401
from app.models.incident import Incident  # noqa: F401
from app.models.rca_feedback import RCAFeedback  # noqa: F401
from app.models.rca_record import RCARecord  # noqa: F401
from app.models.user import User  # noqa: F401

Base.metadata.create_all(bind=engine)

print("DATABASE TABLES CREATED SUCCESSFULLY")
