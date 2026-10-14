from fastapi import FastAPI

app = FastAPI(
        title = "InferOps Demo Application", 
        description = "Demo app used to generate controlled Incidents",
        version = "1.0.0" )

@app.get("/health")
def health_check():
    return { "status" : "healthy",
            "message" : "Demo application is running"
            }

@app.get("/api/data")
def get_data():
    return{
              "status": "success",
        "message": "Demo application data retrieved successfully",
        "data": {
            "service": "payment-service",
            "requests_processed": 100
        }
    }

@app.get("/api/error")
def generate_error():
    raise Exception("application failure")

@app.get("/api/crash")
def crash_application():
    import os

    os._exit(1)

@app.get("/api/db-error")
def database_error():
    raise Exception(
        "Database connection failed: unable to connect to PostgreSQL"
    )

@app.get("/api/high-cpu")
def high_cpu():
    import time
    end_time = time.time() + 10

    while time.time() < end_time:
        pass

    return {
            "status" : "completed",
            "message" : "CPU stress stimulation completed" }

@app.get("/api/config-error")
def config_error():
    required_config = None 

    if required_config is None:
        raise Exception(
                "Configuration error: DATABASE_URL is missing"
                )
    return {
            "status": "Success"
            }

