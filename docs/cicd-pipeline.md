
# InferOps CI/CD Pipeline

## Overview


push / pull request ──► CI (ci.yml)
                         ├─ backend:  ruff lint + pytest
                         ├─ frontend: eslint + vite build
                         └─ docker:   build 3 images + Trivy scan

merge to main ────────► CD (cd.yml)
                         ├─ build backend and frontend images
                         ├─ create a temporary kind cluster
                         ├─ deploy Postgres (pgvector) + backend + frontend
                         ├─ smoke test: /health, similarity search, /rca/analyze
                         └─ publish images to ghcr.io (only if all steps passed)


## One-time GitHub setup

1. Repository Settings -> Secrets and variables -> Actions -> New repository secret:
   - `GEMINI_API_KEY` (optional; without it the /rca/analyze check is skipped)
2. Repository Settings -> Actions -> General -> Workflow permissions:
   choose "Read and write permissions" (needed to publish to GHCR).
3. Optional: Settings -> Branches -> add a rule for `main` that requires the CI checks.

## Run it locally

Docker Compose (simplest):

cp .env.example .env        # then edit the values
docker compose up --build
# Frontend: http://localhost:3000   Backend docs: http://localhost:8000/docs


Kubernetes with kind:

GEMINI_API_KEY=your_key ./scripts/deploy-local.sh
./scripts/smoke-test.sh
kind delete cluster --name inferops     # clean up and free memory


## Secrets

Real keys are never committed. `.env` is git-ignored. In Kubernetes the secret
is created from the command line or from GitHub Actions secrets (see
`k8s/base/secret.example.yml`).
