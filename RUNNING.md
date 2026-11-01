# Run InferOps locally

This guide runs the project with Docker Compose. It starts PostgreSQL with pgvector, the FastAPI backend, and the React dashboard.

## 1. Prerequisites

- Docker Desktop installed and running.
- Git installed.
- A Gemini API key for AI-based RCA. The dashboard and non-AI API checks can start without a key, but RCA analysis requires one.

## 2. Get the project

```bash
git clone -b phase-10-submission-fixes https://github.com/rakshithkr23/Inferops.git
cd Inferops
```

## 3. Configure the environment

Create a root `.env` file:

```env
GEMINI_API_KEY=replace_with_your_own_gemini_api_key
POSTGRES_USER=inferops
POSTGRES_PASSWORD=choose_a_local_password
POSTGRES_DB=inferops

# These defaults avoid common local Kubernetes and app port conflicts.
FRONTEND_PORT=3002
BACKEND_PORT=8002
VITE_API_URL=http://localhost:8002
CORS_ORIGINS=http://localhost:3002
```

Do not commit `.env` or share the API key. The `.env` file is ignored by Git.

If you change the ports, update `FRONTEND_PORT`, `BACKEND_PORT`, `VITE_API_URL`, and `CORS_ORIGINS` consistently. The frontend API URL is embedded at build time, so rebuild the frontend after changing it.

## 4. Start InferOps in an isolated Compose project

Always use the dedicated Compose project name below. It keeps this checkout's containers, network, and PostgreSQL volume separate from another local InferOps checkout.

```bash
docker compose -p inferops-submission up --build -d
```

Do not omit `-p inferops-submission` when managing this checkout. Do not use `down -v` unless you intentionally want to delete this checkout's database volume.

The default dashboard URL is http://localhost:3002 and the API URL is http://localhost:8002. The first build can take several minutes because the backend installs Python dependencies and downloads the sentence-transformer model.

## 5. Open the application

| Component | URL |
|---|---|
| React dashboard | http://localhost:3002 |
| FastAPI Swagger documentation | http://localhost:8002/docs |
| Backend health check | http://localhost:8002/health |

If you selected alternate ports in `.env`, use those ports instead.

Wait for the backend health endpoint to return `{"status":"ok"}`. On first startup, the backend prepares database tables and the embedding model, so initialization can take time.

## 6. Run an RCA from the dashboard

1. Open the dashboard and select **Root Cause Analysis**.
2. Enter an incident type, service name, severity, and a useful description.
3. Select **Analyze incident**.
4. Review the probable root cause, evidence, recommended actions, confidence, limitations, and similar historical incidents returned by the API.
5. Submit feedback if desired.

RCA analysis requires a valid Gemini API key, internet access, and available API quota. It also uses the local sentence-transformer model and historical incident embeddings stored in PostgreSQL/pgvector. The result is an AI-assisted hypothesis, not proof; validate it against real logs, metrics, and Kubernetes events before taking action.

## 7. Useful commands

Run these from this repository root and keep the same project name:

```bash
# Service status
docker compose -p inferops-submission ps

# Backend logs
docker compose -p inferops-submission logs -f backend

# Frontend logs
docker compose -p inferops-submission logs -f frontend

# Stop this checkout without deleting its database volume
docker compose -p inferops-submission down
```

Never use `docker compose down -v` unless you intentionally want to permanently remove this checkout's database data.

## 8. Troubleshooting

- Dashboard unavailable: check the frontend container and its logs.
- API unavailable: check backend logs and wait for database/model initialization.
- Database authentication error: ensure the `.env` credentials are consistent for this isolated first-time database. Existing volumes retain the credentials used when they were initialized.
- RCA API connection error: confirm the backend is reachable at `VITE_API_URL` and that `CORS_ORIGINS` contains the dashboard origin; rebuild the frontend after changing its build-time API URL.
- Gemini error: check the local key, API quota, and backend logs. Never paste the key into chat or commit it.

## 9. Automated checks

GitHub Actions runs backend lint/tests, frontend lint/build, and Docker image builds for configured branch and pull-request events. Check the Actions run for the submission branch before considering CI verified.
