# Run InferOps locally

This guide runs the project with Docker Compose. It starts PostgreSQL with pgvector, the FastAPI backend, and the React dashboard.

## 1. Prerequisites

- Docker Desktop installed and running.
- Git installed.
- A Gemini API key for AI-based RCA. The dashboard and non-AI API checks can start without a key, but RCA analysis requires one.

## 2. Get the project

```bash
git clone https://github.com/rakshithkr23/Inferops.git
cd Inferops
```

If you already have the repository, open a terminal in its root folder and run `git pull` on the branch you intend to use.

## 3. Configure the Gemini key

Create a file named `.env` in the repository root. Add:

```env
GEMINI_API_KEY=replace_with_your_own_gemini_api_key
POSTGRES_USER=inferops
POSTGRES_PASSWORD=change_this_local_password
POSTGRES_DB=inferops
```

Do not commit the `.env` file or share the API key.

## 4. Start the application

From the repository root:

```bash
docker compose up --build -d
```

The first build can take several minutes because the backend image installs Python dependencies and downloads the sentence-transformer model.

## 5. Open InferOps

| Component | URL |
|---|---|
| React dashboard | http://localhost:3000 |
| FastAPI Swagger documentation | http://localhost:8000/docs |
| Backend health check | http://localhost:8000/health |

Wait for the backend health check to return `{"status":"ok"}` before using the dashboard. On first startup, the backend prepares database tables and embeddings, so initialization can take a little while.

## 6. Try the RCA workflow

1. Open the dashboard at http://localhost:3000.
2. Open **Root Cause Analysis**.
3. Enter an incident type, service name, severity, and a description of the problem.
4. Select **Analyze incident**.
5. Review the probable root cause, evidence, recommended actions, confidence, and limitations.
6. Use the feedback buttons to submit feedback.

RCA analysis calls the Gemini API and depends on a valid API key, network access, and available API quota. The generated root cause is an AI-assisted hypothesis; verify it against operational evidence before taking action.

## 7. Useful commands

Run these from the repository root:

```bash
# View service status
docker compose ps

# Follow backend logs
docker compose logs -f backend

# Follow frontend logs
docker compose logs -f frontend

# Stop the Compose application
docker compose down
```

`docker compose down` stops and removes the Compose containers and network but keeps the named PostgreSQL volume. Do not add `-v` unless you intentionally want to delete the database volume and its data.

## 8. Common checks

- If the dashboard does not load, check `docker compose ps` and the frontend logs.
- If Swagger does not load, check backend logs and wait for database/model initialization to finish.
- If RCA reports a Gemini/API error, verify the key in your local `.env`, API quota, and backend logs. Never paste the key into an issue or chat.
- If ports 3000 or 8000 are already occupied, stop the process using that port or deliberately change the host-side port mappings in `docker-compose.yml` and use the matching URL.

## 9. Run automated checks

Backend tests and frontend lint/build checks are configured in GitHub Actions. Review the latest workflow run before treating a change as verified.
