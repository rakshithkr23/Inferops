# InferOps

**AI-Driven DevOps Incident Detection and Root Cause Analysis**

InferOps is a web application for detecting selected application and infrastructure incidents and helping engineers investigate them. It combines rule-based detection with operational evidence and historical incident context to produce an AI-assisted root cause analysis (RCA).

The aim is to bring incident information and investigation support into one place. Engineers can review detected incidents, examine available logs and metrics, run an RCA, and assess the suggested explanation before taking action.

## Overview

InferOps follows two main parts of an incident investigation:

1. **Detection:** application and infrastructure data is checked against configured rules. When a condition matches, the system records an incident.
2. **Analysis:** the RCA workflow uses incident details, available evidence and related historical incidents to prepare context for Gemini. The result is returned in a structured format for review.

Detection is rule-based; the language model is used for analysis, not as the sole mechanism for deciding whether an incident exists.

## Main capabilities

- **Incident monitoring and detection** for configured conditions such as HTTP 500 errors, high error rates, CPU and memory thresholds, and unhealthy container or Kubernetes workloads.
- **Incident records** stored in PostgreSQL for review and historical reference.
- **Logs and metrics views** to help examine operational behaviour.
- **Historical incident retrieval** using text embeddings and pgvector similarity search.
- **AI-assisted root cause analysis** coordinated through a LangGraph workflow and powered by Google Gemini.
- **Structured RCA results** containing a probable root cause, evidence, recommended actions, confidence and limitations.
- **Feedback** so an engineer can indicate whether an RCA result was useful.
- **User authentication** with phone or email and password, plus Google sign-in.

RCA results are suggestions based on the information available to the system. They should be checked against the actual application and infrastructure evidence before remediation.

## Architecture

The application is organized around the following flow:

```text
Application and infrastructure data
                 |
                 v
       Monitoring and rule checks
                 |
                 v
           Incident record
                 |
                 v
       PostgreSQL incident history
                 |
                 v
     Embeddings and pgvector search
                 |
                 v
          RAG context building
                 |
                 v
       LangGraph RCA workflow
                 |
                 v
            Google Gemini
                 |
                 v
       Structured RCA response
                 |
                 v
          React dashboard
                 |
                 v
          Engineer feedback
```

GitHub Actions is used for automated checks and Docker image builds. Docker Compose is the local application environment. Kubernetes manifests are included in the repository for deployment configuration; a running Kubernetes cluster is not required for the Docker Compose setup.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend API | Python, FastAPI |
| Database | PostgreSQL |
| Vector search | pgvector |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| RCA orchestration | LangGraph |
| Generative AI | Google Gemini |
| Containers | Docker, Docker Compose |
| Deployment configuration | Kubernetes, Kustomize |
| CI/CD | GitHub Actions |
| Backend quality checks | Pytest, Ruff |
| Frontend quality checks | ESLint, Vite build |

The sentence-transformer model is pretrained and is used to generate 384-dimensional embeddings for semantic retrieval. It is not trained from scratch as part of InferOps.

## Application sections

The React dashboard provides the following areas:

- **Home:** overview of the system.
- **Incidents:** review recorded incidents.
- **Root Cause Analysis:** submit incident details and review the RCA response.
- **Services:** view service information.
- **Logs & Metrics:** inspect available operational data.
- **Feedback:** submit feedback on the system.
- **Settings:** manage application preferences and account-related settings.

Available data and actions depend on the configured services and the current state of the application.

## Getting started

### Prerequisites

- Git
- Docker Desktop with Docker Compose
- A Google Gemini API key for RCA analysis

### Run with Docker Compose

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/rakshithkr23/Inferops.git
   cd Inferops
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set your local PostgreSQL password and Gemini API key. Set a strong, private `AUTH_SESSION_SECRET` as well. Do not commit this file or share secret values.

4. Build and start the services:

   ```bash
   docker compose up --build -d
   ```

5. Open the application:

   | Service | Address |
   | --- | --- |
   | React dashboard | http://localhost:3002 |
   | FastAPI API | http://localhost:8002 |
   | Swagger documentation | http://localhost:8002/docs |
   | Backend health check | http://localhost:8002/health |

The first startup may take longer while dependencies and the embedding model are prepared. RCA analysis requires a valid Gemini API key, network access and available API quota.

For environment configuration, operational commands and troubleshooting, see [RUNNING.md](RUNNING.md).

## Configuration and security

- Keep API keys, database passwords and session secrets in the local `.env` file.
- Do not commit `.env` or paste secret values into issues, logs or chat.
- Use a unique, strong `AUTH_SESSION_SECRET` for local deployment.
- The example credentials are for local development only; choose your own values.
- If application ports or frontend API settings are changed, keep the related environment values consistent and rebuild the frontend when required.

## Testing and code quality

The repository includes automated checks for the backend and frontend. The backend uses Pytest for tests and Ruff for linting. The frontend uses ESLint and a Vite production build. GitHub Actions runs the configured CI workflow for repository events.

Run the checks from their respective project directories:

```bash
# Backend (from the backend environment)
ruff check .

# Frontend (from the frontend directory)
npm install
npm run lint
npm run build
```

The test suite and CI results can change as the code changes; refer to the latest GitHub Actions run for the current status.

## Repository layout

```text
Inferops/
├── backend/             # FastAPI application and backend logic
├── frontend/            # React dashboard
├── k8s/                 # Kubernetes deployment configuration
├── scripts/             # Project scripts
├── tests/               # Automated tests
├── docs/                # Project documentation
├── .github/workflows/   # GitHub Actions workflows
├── docker-compose.yml   # Local multi-container environment
├── .env.example         # Example environment variables
├── RUNNING.md           # Local setup and operating guide
└── README.md
```

## Deployment notes

Docker Compose is the documented way to run InferOps locally. Kubernetes configuration is maintained separately under `k8s/` for deployment use. The presence of these manifests should not be taken as confirmation that a Kubernetes cluster is currently running or that a live Kubernetes deployment has been validated.

## Limitations

- Incident detection is based on configured rules and available monitoring data.
- RCA quality depends on the completeness and accuracy of the incident description, logs, metrics and historical records.
- Gemini analysis requires an available API key, network connectivity and API quota.
- AI-generated root causes and recommendations are not guaranteed to be correct and require engineering review.
- Kubernetes runtime behaviour must be validated in a configured cluster; it is separate from local Docker Compose operation.

## Future improvements

Potential areas for further work include additional monitoring sources, distributed tracing, more comprehensive incident datasets, evaluation against labelled root causes, alert integrations and carefully controlled remediation workflows.

## License

No open-source license has been specified for this repository. Contact the project owner before reusing or distributing the code.
