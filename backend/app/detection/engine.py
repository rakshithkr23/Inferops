from app.detection.rules import (
    detect_application_exception,
    detect_high_cpu_usage,
    detect_high_error_rate,
    detect_high_memory_usage,
    detect_http_500,
    detect_unhealthy_container,
    detect_unhealthy_workload,
)


def detect_incidents(
    status_code: int | None = None,
    error_rate_percent: float | None = None,
    total_requests: int = 0,
    error_message: str | None = None,
    pod_status: str | None = None,
    restart_count: int = 0,
    cpu_usage_percent: float | None = None,
    memory_usage_percent: float | None = None,
    container_status: str | None = None,
    docker_restart_count: int = 0,
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

    if cpu_usage_percent is not None:
        incident = detect_high_cpu_usage(cpu_usage_percent)
        if incident is not None:
            incidents.append(incident)

    if memory_usage_percent is not None:
        incident = detect_high_memory_usage(memory_usage_percent)
        if incident is not None:
            incidents.append(incident)

    if container_status is not None:
        incident = detect_unhealthy_container(
            container_status,
            restart_count=docker_restart_count,
        )
        if incident is not None:
            incidents.append(incident)

    return incidents