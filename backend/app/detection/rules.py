def detect_http_500(status_code: int) -> dict | None:
    if status_code == 500:
        return {
            "type": "HTTP_500_ERROR",
            "severity": "HIGH",
            "description": "The application returned an HTTP 500 Internal Server Error."
        }
    return None

def detect_high_error_rate(
    error_rate_percent: float,
    threshold: float = 10.0,
    total_requests: int = 10
) -> dict | None:
    if total_requests >= 10 and error_rate_percent > threshold:
        return {
            "type": "HIGH_ERROR_RATE",
            "severity": "HIGH",
            "description": (
                f"Error rate is {error_rate_percent}%, "
                f"exceeding the threshold of {threshold}%."
            )
        }

    return None

def detect_application_exception(error_message: str) -> dict | None:
    if not error_message.strip():
        return None

    return {
        "type": "APPLICATION_EXCEPTION",
        "severity": "HIGH",
        "description": f"Application exception detected: {error_message}"
    }

def detect_unhealthy_workload(
    pod_status: str,
    restart_count: int = 0
) -> dict | None:
    unhealthy_statuses = {
        "CrashLoopBackOff",
        "Error",
        "ImagePullBackOff",
        "ErrImageNeverPull",
        "Failed"
    }

    if pod_status in unhealthy_statuses:
        return {
            "type": "UNHEALTHY_KUBERNETES_WORKLOAD",
            "severity": "HIGH",
            "description": (
                f"Kubernetes workload is unhealthy: "
                f"status={pod_status}, restarts={restart_count}."
            )
        }

    if restart_count >= 3:
        return {
            "type": "UNHEALTHY_KUBERNETES_WORKLOAD",
            "severity": "HIGH",
            "description": (
                f"Kubernetes workload has restarted "
                f"{restart_count} times."
            )
        }

    return None