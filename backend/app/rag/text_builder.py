def build_incident_text(incident) -> str:
    """Convert a historical incident into consistent text for semantic search."""
    fields = [
        ("Incident type", incident.incident_type),
        ("Affected service", incident.service_name),
        ("Severity", incident.severity),
        ("Description", incident.description),
        ("Root cause", incident.root_cause),
        ("Resolution", incident.resolution),
    ]

    return "\n".join(
        f"{label}: {value.strip()}"
        for label, value in fields
        if value and value.strip()
    )
