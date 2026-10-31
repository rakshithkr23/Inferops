
from app.database.dependencies import get_db
from app.routes import router
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

app = FastAPI(
    title="InferOps API",
    description="AI-Driven DevOps Incident Detection and Root Cause Analysis System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
