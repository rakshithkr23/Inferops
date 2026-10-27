from pydantic import BaseModel, Field

class RAGSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        description="Description of the incident to search for",
    )
    limit: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum number of similar historical incidents",
    )

class RAGSearchResult(BaseModel):
    id: int
    incident_type: str
    service_name: str
    severity: str
    description: str
    root_cause: str
    resolution: str
    similarity: float

class RAGSearchResponse(BaseModel):
    query: str
    results: list[RAGSearchResult]
    total_results: int