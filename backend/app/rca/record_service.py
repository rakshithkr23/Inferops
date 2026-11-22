
from sqlalchemy.orm import Session

from app.models.rca_record import RCARecord


def get_recent_rca_records(db: Session, limit: int = 5):
    """
    Return the most recently completed RCA records.

    Only successfully saved RCA records are stored in this table.
    Newest records are returned first.
    """
    return (
        db.query(RCARecord)
        .order_by(
            RCARecord.created_at.desc(),
            RCARecord.id.desc(),
        )
        .limit(limit)
        .all()
    )
