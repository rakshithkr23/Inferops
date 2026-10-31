import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.routes import router

app = FastAPI(
    title="InferOps API",
    description="AI-Driven DevOps Incident Detection and Root Cause Analysis System",
    version="0.1.0"
)

cors_origins = [ 
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS","http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

@app.get("/health")
def health():
    """Liveness/readiness endpoint used by Docker and Kubernetes probes."""
    return {"status":"ok"}


@app.get("/db-test")
def database_test(db: Session = Depends(get_db)):
    return {
        "status": "success",
        "message": "FastAPI database session is working"
    }
