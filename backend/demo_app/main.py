import logging
import time
from collections import defaultdict, deque
from threading import Lock
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from pydantic import BaseModel
import psutil
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("inferops.demo")
log_buffer = deque(maxlen=200)
log_lock = Lock()

class InMemoryLogHandler(logging.Handler):
    def emit(self, record):
        log_entry = {
            "timestamp": self.formatter.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }

        with log_lock:
            log_buffer.append(log_entry)

log_handler = InMemoryLogHandler()
log_handler.setFormatter(logging.Formatter("%(asctime)s"))
logger.addHandler(log_handler)
metrics_lock = Lock()

request_count = 0
http_status_counts = defaultdict(int)
total_response_time = 0.0

# Store the latest 60 minutes of metrics
metrics_history = deque(maxlen=60)


def record_request_metrics(status_code, elapsed):
    timestamp = datetime.now(timezone.utc).replace(
        second=0,
        microsecond=0
    )

    with metrics_lock:
        # Create a new bucket when the minute changes
        if (
            not metrics_history
            or metrics_history[-1]["timestamp"] != timestamp
        ):
            metrics_history.append({
                "timestamp": timestamp,
                "request_count": 0,
                "success_count": 0,
                "client_error_count": 0,
                "server_error_count": 0,
                "error_count": 0,
                "total_response_time_seconds": 0.0,
                "min_response_time_seconds": None,
                "max_response_time_seconds": 0.0
            })

        bucket = metrics_history[-1]

        bucket["request_count"] += 1

        if 200 <= status_code < 300:
            bucket["success_count"] += 1
        elif 400 <= status_code < 500:
            bucket["client_error_count"] += 1
            bucket["error_count"] += 1
        elif 500 <= status_code < 600:
            bucket["server_error_count"] += 1
            bucket["error_count"] += 1

        bucket["total_response_time_seconds"] += elapsed

        if bucket["min_response_time_seconds"] is None:
            bucket["min_response_time_seconds"] = elapsed
        else:
            bucket["min_response_time_seconds"] = min(
                bucket["min_response_time_seconds"],
                elapsed
            )

        bucket["max_response_time_seconds"] = max(
            bucket["max_response_time_seconds"],
            elapsed
        )

app = FastAPI(
    title="InferOps Demo Application",
    description="Demo app used to generate controlled Incidents",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
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

        record_request_metrics(500, elapsed)

        logger.exception("Unhandled exception while processing request")
        raise

    elapsed = time.perf_counter() - start_time

    with metrics_lock:
        request_count += 1
        http_status_counts[response.status_code] += 1
        total_response_time += elapsed

    record_request_metrics(response.status_code, elapsed)

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

@app.get("/metrics/history")
def get_metrics_history():
    with metrics_lock:
        history = list(metrics_history)

    return [
        {
            "timestamp": bucket["timestamp"].isoformat(),

            "request_count": bucket["request_count"],
            "success_count": bucket["success_count"],
            "client_error_count": bucket["client_error_count"],
            "server_error_count": bucket["server_error_count"],
            "error_count": bucket["error_count"],

            "average_response_time_seconds": (
                round(
                    bucket["total_response_time_seconds"]
                    / bucket["request_count"],
                    6
                )
                if bucket["request_count"] else 0.0
            ),
            "min_response_time_seconds": (
                round(bucket["min_response_time_seconds"], 6)
                if bucket["min_response_time_seconds"] is not None
                else 0.0
            ),
            "max_response_time_seconds": round(
                bucket["max_response_time_seconds"],
                6
            )
        }
        for bucket in history
    ]

@app.get("/system/metrics")
def get_system_metrics():
    memory = psutil.virtual_memory()

    return {
        "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
        "memory_usage_percent": memory.percent,
        "memory_used_mb": round(memory.used / (1024 * 1024), 2),
        "memory_total_mb": round(memory.total / (1024 * 1024), 2)
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

@app.get("/logs")
def get_logs():
    with log_lock:
        logs = list(log_buffer)

    return {
        "total_logs": len(logs),
        "logs": logs
    }
