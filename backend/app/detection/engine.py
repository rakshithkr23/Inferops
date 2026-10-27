from app.detection.rules import (
    detect_http_500,
    detect_high_error_rate,
    detect_application_exception,
    detect_unhealthy_workload,
)


def detect_incidents(
    status_code: int | None = None,
    error_rate_percent: float | None = None,
    total_requests: int = 0,
    error_message: str | None = None,
    pod_status: str | None = None,
    restart_count: int = 0,
) -> list[dict]:
    incidents = []

    if status_code is not None:
        incident = detect_http_500(status_code)
        if incident is not None:
            incidents.append(incident)

    if error_rate_percent is not None:
        incident = detect_high_error_rate(
            error_rate_percent,
            total_requests=total_requests,
        )
        if incident is not None:
            incidents.append(incident)

    if error_message is not None:
        incident = detect_application_exception(error_message)
        if incident is not None:
            incidents.append(incident)

    if pod_status is not None:
        incident = detect_unhealthy_workload(
            pod_status,
            restart_count=restart_count,
        )
        if incident is not None:
            incidents.append(incident)

    return incidents