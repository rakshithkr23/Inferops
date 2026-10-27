from typing import TypedDict, Any
from langgraph.graph import StateGraph, START, END
from app.rca.service import analyze_incident

class RCAState(TypedDict, total=False):
    incident_type: str
    service_name: str
    severity: str
    description: str
    rca_result: dict[str, Any]

def run_rca_node(state: RCAState) -> dict[str, Any]:
    """Run the existing AI root-cause analysis service."""
    result = analyze_incident(
        incident_type=state["incident_type"],
        service_name=state["service_name"],
        severity=state["severity"],
        description=state["description"],
    )
    return {"rca_result": result}

def build_rca_workflow():
    """Build and compile the InferOps RCA LangGraph workflow."""
    graph = StateGraph(RCAState)
    graph.add_node("analyze_incident", run_rca_node)

    graph.add_edge(START, "analyze_incident")
    graph.add_edge("analyze_incident", END)

    return graph.compile()

rca_workflow = build_rca_workflow()
