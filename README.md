# InferOps

## AI-Driven DevOps Incident Detection and Root Cause Analysis System

InferOps is an AI-driven DevOps incident detection and Root Cause Analysis (RCA) system designed to help DevOps engineers identify application and infrastructure incidents, collect relevant operational evidence, analyze historical incidents, and generate an explainable root-cause analysis.

The system combines **DevOps automation, Kubernetes, observability, rule-based incident detection, Retrieval-Augmented Generation (RAG), vector search, LangGraph, and Gemini** into a single workflow.

---

## 1. Project Overview

Modern applications deployed using Docker and Kubernetes can experience different types of failures such as application crashes, HTTP errors, database connectivity problems, resource exhaustion, configuration errors, and Kubernetes pod failures.

Traditionally, troubleshooting these incidents requires engineers to manually inspect:

* Application logs
* System metrics
* Kubernetes status
* Deployment information
* Database errors
* Previous incident records

This manual investigation can increase the time required to identify the root cause and resolve an incident.

**InferOps** aims to automate this process.

It first detects incidents using predefined rules and operational data. It then collects logs, metrics, and Kubernetes status as evidence. Historical incidents are retrieved using RAG and pgvector, and a LangGraph-based workflow coordinates the RCA process. Gemini is used to analyze the collected evidence and generate a structured RCA result.

The result is presented through a React dashboard where the DevOps engineer can review the analysis and provide **👍 / 👎 feedback**.

---

## 2. Problem Statement

Applications running in containerized and Kubernetes environments can fail due to:

* Application errors
* HTTP 500 errors
* Database connection failures
* High CPU or memory usage
* Container crashes
* Kubernetes `CrashLoopBackOff`
* Deployment failures
* Configuration problems
* Resource exhaustion

Identifying the root cause often requires manual investigation across multiple sources.

Therefore, there is a need for a system that can automatically detect incidents, collect relevant evidence, use historical incident knowledge, and assist engineers in determining the probable root cause.

---

## 3. Proposed Solution

InferOps provides an automated incident analysis pipeline.

The system:

1. Receives application and infrastructure information.
2. Monitors logs, metrics, and Kubernetes status.
3. Detects incidents using predefined rules.
4. Stores incident information in PostgreSQL.
5. Retrieves similar historical incidents.
6. Uses pgvector for vector similarity search.
7. Builds relevant context using RAG.
8. Uses LangGraph to orchestrate the RCA workflow.
9. Uses Gemini to analyze the collected evidence.
10. Generates a structured RCA result.
11. Displays the result through a React dashboard.
12. Allows the DevOps engineer to provide 👍 / 👎 feedback.
13. Stores feedback for future analysis.

---

# 4. System Architecture

```text
                 DEVELOPER
                     │
                     │ git push
                     ▼
                  GITHUB
                     │
                     ▼
              ┌──────────────┐
              │ GitHub       │
              │ Actions      │
              │ CI/CD        │
              └──────┬───────┘
                     │
              ┌──────┴───────┐
              ▼              ▼
            Tests          Docker
                             │
                             ▼
                       Docker Image
                             │
                             ▼
                       Kubernetes
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                 FastAPI          PostgreSQL
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
        Logs      Metrics    K8s Status
          │         │          │
          └─────────┼──────────┘
                    ▼
             Incident Engine
                    │
                    ▼
                PostgreSQL
                    │
                    ▼
             Historical Data
                    │
                    ▼
               RAG + pgvector
                    │
                    ▼
                LangGraph
                    │
                    ▼
                 Gemini
                    │
                    ▼
              RCA Result
                    │
                    ▼
                 FastAPI
                    │
                    ▼
              React Dashboard
                    │
             ┌──────┴──────┐
             ▼             ▼
            👍             👎
             │             │
             └──────┬──────┘
                    ▼
                PostgreSQL
                    │
                    ▼
             DevOps Engineer
```

---

# 5. Project Workflow

The overall InferOps workflow is divided into several stages.

### Stage 1 — Development and CI/CD

```text
Developer
    ↓
Git Push
    ↓
GitHub
    ↓
GitHub Actions
    ↓
Automated Tests
    ↓
Docker Build
```

### Stage 2 — Deployment

```text
Docker Image
     ↓
Kubernetes
     ↓
FastAPI Application
```

### Stage 3 — Observability

InferOps collects operational information from:

```text
Application
   ├── Logs
   ├── Metrics
   └── Kubernetes Status
```

### Stage 4 — Incident Detection

```text
Logs
Metrics
K8s Status
     ↓
Incident Engine
     ↓
Incident Detected
```

The initial incident detection mechanism uses predefined rules rather than relying entirely on an LLM.

Examples include:

* HTTP 500 error rate exceeding a threshold
* High CPU usage
* Database connection errors
* Kubernetes `CrashLoopBackOff`
* Failed pods
* Application failures

### Stage 5 — Historical Incident Retrieval

```text
Current Incident
       ↓
PostgreSQL
       ↓
Historical Incidents
       ↓
pgvector
       ↓
Similar Incidents
```

### Stage 6 — AI-Based RCA

```text
Incident
   +
Logs
   +
Metrics
   +
K8s Status
   +
Historical Context
       ↓
      RAG
       ↓
   LangGraph
       ↓
     Gemini
       ↓
   RCA Result
```

### Stage 7 — Dashboard and Feedback

```text
RCA Result
     ↓
React Dashboard
     ↓
DevOps Engineer
     ↓
👍 / 👎
     ↓
PostgreSQL
```

---

# 6. Key Features

## Incident Detection

Automatically identifies predefined operational incidents using application and infrastructure information.

## Log Analysis

Uses application logs as evidence during incident investigation.

## Metrics Analysis

Uses operational metrics such as:

* CPU usage
* Memory usage
* Request count
* HTTP error rate
* Response time

## Kubernetes Monitoring

Examines Kubernetes information such as:

* Pod status
* Restart count
* Deployment status
* Failed pods
* `CrashLoopBackOff`

## Historical Incident Analysis

Stores previous incidents in PostgreSQL so that similar incidents can be retrieved during future RCA.

## RAG

Retrieves relevant historical information and provides it as context for the RCA process.

## Vector Search with pgvector

Uses vector similarity search to identify historically similar incidents.

## LangGraph RCA Workflow

Coordinates multiple RCA processing stages such as evidence collection, historical retrieval, context construction, and AI analysis.

## Gemini-Based RCA

Gemini analyzes the collected evidence and generates a probable root cause and recommended action.

## React Dashboard

Provides a user interface for viewing:

* Active incidents
* Incident details
* RCA results
* Evidence
* Root cause
* Recommended actions
* RCA feedback

## RCA Feedback

The DevOps engineer can provide:

```text
👍 Helpful
👎 Not Helpful
```

Feedback is stored in PostgreSQL for later analysis.

---

# 7. Technology Stack

| Category                | Technology                         |
| ----------------------- | ---------------------------------- |
| Programming Language    | Python                             |
| Backend                 | FastAPI                            |
| Database                | PostgreSQL                         |
| ORM                     | SQLAlchemy                         |
| Frontend                | React                              |
| Containerization        | Docker                             |
| Container Orchestration | Kubernetes                         |
| CI/CD                   | GitHub Actions                     |
| Version Control         | Git + GitHub                       |
| Observability           | Logs + Metrics + Kubernetes Status |
| Vector Database         | PostgreSQL + pgvector              |
| RAG                     | Retrieval-Augmented Generation     |
| AI Workflow             | LangGraph                          |
| LLM                     | Gemini                             |
| API Testing             | Swagger / OpenAPI                  |
| Development Environment | WSL2 + Ubuntu + VS Code            |

---

# 8. Project Modules

InferOps is divided into the following major modules:

```text
InferOps
│
├── Development & Version Control
│   ├── Git
│   └── GitHub
│
├── CI/CD
│   └── GitHub Actions
│
├── Application
│   └── FastAPI
│
├── Containerization
│   └── Docker
│
├── Infrastructure
│   └── Kubernetes
│
├── Observability
│   ├── Logs
│   ├── Metrics
│   └── Kubernetes Status
│
├── Incident Detection
│   └── Incident Engine
│
├── Data Storage
│   └── PostgreSQL
│
├── Historical Knowledge
│   └── Historical Incidents
│
├── AI/Retrieval
│   ├── pgvector
│   ├── RAG
│   ├── LangGraph
│   └── Gemini
│
├── Frontend
│   └── React Dashboard
│
└── Feedback
    ├── 👍 Positive
    └── 👎 Negative
```

---

# 9. Database Concept

PostgreSQL is used as the main persistent data store.

The database will contain information related to:

```text
Services
    ↓
Incidents
    ↓
Logs
    ↓
RCA Results
    ↓
Feedback
```

Historical incident information can also be represented as vector data through **pgvector** to support similarity-based retrieval.

---

# 10. RCA Output

InferOps aims to provide a structured RCA result containing information such as:

```text
Incident:
Database Connection Failure

Severity:
High

Root Cause:
Probable database connection pool exhaustion

Evidence:
- Database connection timeout errors
- Increased connection usage
- Similar historical incident

Historical Context:
Similar incident found

Recommended Action:
Investigate connection pool configuration and
long-running database connections.

Confidence:
High
```

The exact response schema will be finalized during implementation.

---

# 11. Feedback Mechanism

After viewing an RCA result, the DevOps engineer can provide feedback:

```text
Was this RCA useful?

       👍        👎
```

The feedback is sent to the FastAPI backend and stored in PostgreSQL.

Example:

```text
feedback
--------------------------------
id
incident_id
rca_id
feedback_type
created_at
```

Possible values:

```text
positive
negative
```

The feedback represents **user acceptance/usefulness of the RCA**, and should not automatically be interpreted as ground-truth AI accuracy.

---

# 12. Project Development Phases

The project will be developed in the following phases:

| Phase    | Module                                |
| -------- | ------------------------------------- |
| Phase 1  | Project Planning & Requirements       |
| Phase 2  | Development Environment & Repository  |
| Phase 3  | FastAPI Backend + PostgreSQL          |
| Phase 4  | Demo Application / Failure Generation |
| Phase 5  | Dockerization                         |
| Phase 6  | GitHub Actions CI/CD                  |
| Phase 7  | Kubernetes Deployment                 |
| Phase 8  | Logs + Metrics + Kubernetes Status    |
| Phase 9  | Incident Detection Engine             |
| Phase 10 | Incident & Historical Data            |
| Phase 11 | RAG + pgvector                        |
| Phase 12 | LangGraph RCA Workflow                |
| Phase 13 | Gemini Integration                    |
| Phase 14 | RCA API                               |
| Phase 15 | React Dashboard                       |
| Phase 16 | RCA Feedback System                   |
| Phase 17 | Feedback Analytics                    |
| Phase 18 | End-to-End Integration                |
| Phase 19 | Testing & Failure Injection           |
| Phase 20 | Security & Reliability                |
| Phase 21 | Documentation & Final Demonstration   |

---

# 13. Example Failure Scenarios

InferOps will be tested using controlled failure scenarios.

### HTTP 500 Error

```text
Application
    ↓
HTTP 500
    ↓
Log
    ↓
Incident Engine
    ↓
RCA
```

### Kubernetes CrashLoopBackOff

```text
Application
    ↓
Container Failure
    ↓
Kubernetes Pod
    ↓
CrashLoopBackOff
    ↓
Incident Engine
    ↓
RCA
```

### High CPU

```text
Application
    ↓
High CPU
    ↓
Metrics
    ↓
Incident Engine
    ↓
RCA
```

### Database Connection Failure

```text
Application
    ↓
Database Error
    ↓
Logs
    ↓
Incident Engine
    ↓
Historical Search
    ↓
RAG
    ↓
Gemini
    ↓
RCA
```

---

# 14. Expected Outcome

The final InferOps system is expected to provide a complete workflow for:

```text
Incident Detection
        ↓
Evidence Collection
        ↓
Historical Incident Retrieval
        ↓
AI-Assisted Root Cause Analysis
        ↓
RCA Recommendation
        ↓
Dashboard Visualization
        ↓
Engineer Feedback
```

The project demonstrates the integration of **DevOps, containerization, Kubernetes, observability, backend development, databases, vector search, RAG, AI workflow orchestration, LLM-based analysis, and frontend development** in one practical system.

---

# 15. Future Scope

Possible future improvements include:

* More advanced anomaly detection
* Additional observability sources
* Distributed tracing
* Automated remediation
* More sophisticated feedback analysis
* RCA quality evaluation using labeled incidents
* Support for additional LLM providers
* Multi-service dependency analysis
* Alert integrations
* Production-scale Kubernetes deployment
* Continuous improvement using validated incident feedback

---

# 16. Project Status

**Current Status:** Under Development

```text
Phase 1  — Planning                 ✅
Phase 2  — Environment              🟢
Phase 3  — Backend                  🔜
Phase 4  — Demo Application         🔜
Phase 5  — Docker                   🔜
Phase 6  — CI/CD                    🔜
Phase 7  — Kubernetes               🔜
Phase 8  — Observability            🔜
Phase 9  — Incident Engine          🔜
Phase 10 — Historical Data          🔜
Phase 11 — RAG + pgvector           🔜
Phase 12 — LangGraph                🔜
Phase 13 — Gemini                   🔜
Phase 14 — RCA API                 🔜
Phase 15 — React Dashboard          🔜
Phase 16 — Feedback                 🔜
Phase 17 — Feedback Analytics       🔜
Phase 18 — Integration              🔜
Phase 19 — Testing                  🔜
Phase 20 — Security                 🔜
Phase 21 — Documentation            🔜
```

---

# 17. Repository Structure

The project will follow a modular structure:

```text
inferops/
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│
├── k8s/
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── secret.yaml
│
├── docker/
│
├── tests/
│
├── docs/
│
├── .github/
│   └── workflows/
│
├── .gitignore
│
└── README.md
```

---

# 18. License

This project is developed as an academic MCA project for educational and demonstration purposes.
