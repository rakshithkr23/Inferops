import logging
import time
from collections import defaultdict
from threading import Lock

from fastapi import FastAPI, Request
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("inferops.demo")
metrics_lock = Lock()

request_count = 0
http_status_counts = defaultdict(int)
total_response_time = 0.0

app = FastAPI(
    title="InferOps Demo Application",
    description="Demo app used to generate controlled Incidents",
    version="1.0.0"
)

@app.middleware("http")
async def collect_metrics(request: Request, call_next):
    global request_count, total_response_time

    start_time = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        elapsed = time.perf_counter() - start_time

        with metrics_lock:
            request_count += 1
            http_status_counts[500] += 1
            total_response_time += elapsed

        logger.exception("Unhandled exception while processing request")
        raise

    elapsed = time.perf_counter() - start_time

    with metrics_lock:
        request_count += 1
        http_status_counts[response.status_code] += 1
        total_response_time += elapsed

    response.headers["X-Response-Time"] = f"{elapsed:.6f}"

    return response

@app.get("/metrics")
def get_metrics():
    with metrics_lock:
        counts = dict(http_status_counts)
        total_requests = request_count
        total_time = total_response_time

    error_count = sum(
        count for status, count in counts.items()
        if status >= 400
    )

    return {
        "total_requests": total_requests,
        "http_status_counts": counts,
        "error_count": error_count,
        "error_rate_percent": (
            round(error_count / total_requests * 100, 2)
            if total_requests else 0.0
        ),
        "average_response_time_seconds": (
            round(total_time / total_requests, 6)
            if total_requests else 0.0
        )
    }

@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")

    return {
        "status": "healthy",
        "message": "Demo application is running"
    }

@app.get("/api/data")
def get_data():
    logger.info("Application data endpoint called")

    return {
        "status": "success",
        "message": "Demo application data retrieved successfully",
        "data": {
            "service": "payment-service",
            "requests_processed": 100
        }
    }

@app.get("/api/error")
def generate_error():
    logger.error("Application failure endpoint triggered")
    raise Exception("application failure")

@app.get("/api/crash")
def crash_application():
    logger.critical("Application crash endpoint triggered")

    import os
    os._exit(1)

@app.get("/api/db-error")
def database_error():
    logger.error("Database connection failure endpoint triggered")

    raise Exception(
        "Database connection failed: unable to connect to PostgreSQL"
    )

@app.get("/api/high-cpu")
def high_cpu():
    logger.warning("CPU stress endpoint triggered")

    import time
    end_time = time.time() + 10

    while time.time() < end_time:
        pass

    logger.info("CPU stress simulation completed")

    return {
        "status": "completed",
        "message": "CPU stress stimulation completed"
    }
@app.get("/api/config-error")
def config_error():
    required_config = None
    if required_config is None:
        logger.error("Configuration error: DATABASE_URL is missing")

        raise Exception(
            "Configuration error: DATABASE_URL is missing"
        )

    return {
        "status": "Success"
    }

class IncidentRequest(BaseModel):
    incident_type: str
    service: str = "payment-service"

@app.post("/api/incident")
def create_incident(request: IncidentRequest):
    logger.warning(
        "Incident requested: type=%s, service=%s",
        request.incident_type,
        request.service
    )

    return {
        "status": "success",
        "message": "Controlled incident request received",
        "incident_type": request.incident_type,
        "service": request.service
    }