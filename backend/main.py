from fastapi import FastAPI

app = FastAPI(
    title="InferOps API",
    description="AI-Driven DevOps Incident Detection and Root Cause Analysis System",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "project": "InferOps",
        "status": "running",
        "message": "InferOps backend is working"
    }