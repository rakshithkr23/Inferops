from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.routes import router 

app = FastAPI(
    title="InferOps API",
    description="AI-Driven DevOps Incident Detection and Root Cause Analysis System",
    version="0.1.0"
)
app.include_router(router)


@app.get("/")
def root():
    return {
        "project": "InferOps",
        "status": "running",
        "message": "InferOps backend is working"
    }


@app.get("/db-test")
def database_test(db: Session = Depends(get_db)):
    return {
        "status": "success",
        "message": "FastAPI database session is working"
    }
