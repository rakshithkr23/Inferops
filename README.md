# InferOps

<p align="center">
  <strong>AI-Driven DevOps Incident Detection & Root Cause Analysis</strong><br/>
  Detect operational issues, explore evidence, and investigate incidents with AI-assisted RCA.
</p>

---

## Overview

**InferOps** is a DevOps incident monitoring and investigation platform that combines rule-based incident detection, operational evidence, historical incident retrieval, and AI-assisted root cause analysis.

It helps engineers review detected incidents, examine available logs and metrics, and generate structured RCA results using a retrieval-augmented workflow. The system is designed to support investigation—not replace engineering judgment.

## Features

- **Rule-based incident detection:** monitors configured conditions, including HTTP errors, error rates, CPU and memory usage, and container or Kubernetes health.
- **Incident management:** records detected incidents in PostgreSQL for review and historical reference.
- **Logs & metrics:** provides views to inspect available operational information.
- **Historical incident retrieval:** uses embeddings and pgvector similarity search to retrieve relevant incident context.
- **AI-assisted RCA:** uses a LangGraph workflow and Google Gemini to analyze incident details and available evidence.
- **Structured analysis:** returns a probable root cause, evidence, recommended actions, confidence, and limitations.
- **Feedback:** allows users to provide feedback on RCA results.
- **Authentication:** supports password-based sign-in using phone number or email, and Google sign-in.

> RCA output is advisory. Validate recommendations against actual system evidence before taking action.

## Workflow

```text
Application & Infrastructure Data
               |
               v
       Monitoring & Rule Checks
               |
               v
         Incident Detection
               |
               v
     Incident History (PostgreSQL)
               |
               v
       Embeddings + pgvector
               |
               v
        Historical Retrieval
               |
               v
        LangGraph RCA Workflow
               |
               v
          Google Gemini
               |
               v
       Structured RCA Results
               |
               v
        InferOps Dashboard
               |
               v
             Feedback
```

GitHub Actions supports automated checks and image builds. Docker Compose provides the local multi-container environment. Kubernetes configuration is also included in the repository for deployment scenarios.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Vector database extension | pgvector |
| Embedding model | sentence-transformers/all-MiniLM-L6-v2 |
| RCA orchestration | LangGraph |
| AI model | Google Gemini |
| Containers | Docker, Docker Compose |
| Orchestration configuration | Kubernetes, Kustomize |
| CI/CD | GitHub Actions |
| Backend testing & linting | Pytest, Ruff |
| Frontend checks | ESLint, Vite build |

The embedding model is pretrained and produces 384-dimensional embeddings for semantic retrieval.

## Dashboard

InferOps includes the following dashboard sections:

| Page | Purpose |
|---|---|
| **Home** | System overview |
| **Incidents** | Review detected incidents |
| **Root Cause Analysis** | Submit incident details and inspect RCA results |
| **Services** | Review service information |
| **Logs & Metrics** | Inspect available operational data |
| **Feedback** | Submit feedback |
| **Settings** | Manage preferences and account settings |

## Getting Started

### Prerequisites

- Git
- Docker Desktop with Docker Compose
- Google Gemini API key for AI-powered RCA

### 1. Clone the repository

```bash
git clone https://github.com/rakshithkr23/Inferops.git
cd Inferops
```

### 2. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the required values, including your database password, Gemini API key, and a strong session secret.

**Keep your secrets private. Never commit your local `.env` file.**

### 3. Build and start InferOps

```bash
docker compose up --build -d
```

### 4. Access the application

| Service | URL |
|---|---|
| Dashboard | http://localhost:3002 |
| Backend API | http://localhost:8002 |
| API documentation | http://localhost:8002/docs |
| Health check | http://localhost:8002/health |

The first startup may take longer while dependencies and the embedding model are initialized. RCA requests require a valid Gemini API key, network access, and available API quota.

For environment variables, commands, and troubleshooting, see **[RUNNING.md](RUNNING.md)**.

## Testing & Code Quality

The repository includes backend and frontend quality checks.

### Backend

From the backend environment:

```bash
ruff check .
pytest
```

### Frontend

From the frontend directory:

```bash
npm install
npm run lint
npm run build
```

GitHub Actions runs the configured workflows. Check the Actions tab for the latest execution results.

## Repository Structure

```text
Inferops/
├── backend/              # FastAPI API and backend logic
├── frontend/             # React application
├── k8s/                 # Kubernetes configuration
├── scripts/              # Project scripts
├── tests/                # Automated tests
├── docs/                 # Documentation
├── .github/workflows/    # GitHub Actions workflows
├── docker-compose.yml    # Local services
├── .env.example          # Example environment configuration
├── RUNNING.md             # Setup and operations guide
└── README.md
```

## Security Notes

- Store credentials and API keys in your local environment file.
- Never commit secrets, access tokens, or passwords.
- Use a strong, unique session secret.
- Configure network exposure and access controls appropriately before deploying publicly.
- Review AI recommendations before applying changes to infrastructure.

## Limitations

- Detection depends on configured rules and the monitoring data available to the system.
- RCA quality depends on the incident details, evidence, and historical context provided.
- Gemini availability depends on API access, connectivity, and quota.
- AI-generated explanations and recommendations may be inaccurate.
- Kubernetes manifests do not imply that a Kubernetes cluster is running or that a deployment has been validated.

## Future Work

- Integrate additional monitoring and visualization tools.
- Expand historical incident data and RCA evaluation.
- Add distributed logging and tracing.
- Improve RCA accuracy assessment.
- Explore alerting integrations and controlled remediation.

## License

No open-source license has been specified. Contact the repository owner before reusing or distributing this project.
