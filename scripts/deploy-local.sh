#!/usr/bin/env bash
# Build images, create a local kind cluster and deploy InferOps to it.
# Usage:  GEMINI_API_KEY=your_key ./scripts/deploy-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CLUSTER=inferops
DB_PASSWORD="${POSTGRES_PASSWORD:-inferops}"

echo "==> Building images"
docker build -t inferops-backend:local ./backend
docker build -t inferops-frontend:local ./frontend

echo "==> Creating kind cluster (if missing)"
if ! kind get clusters | grep -qx "$CLUSTER"; then
  kind create cluster --name "$CLUSTER" --config k8s/kind-config.yml
fi

echo "==> Loading images into the cluster"
kind load docker-image inferops-backend:local --name "$CLUSTER"
kind load docker-image inferops-frontend:local --name "$CLUSTER"

echo "==> Applying manifests"
kubectl apply -f k8s/base/namespace.yml
kubectl -n inferops create secret generic inferops-secrets \
  --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
  --from-literal=DATABASE_URL="postgresql+psycopg://inferops:${DB_PASSWORD}@postgres:5432/inferops" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k k8s/base

echo "==> Waiting for rollout"
kubectl -n inferops rollout status statefulset/postgres --timeout=300s
kubectl -n inferops rollout status deployment/inferops-backend --timeout=600s
kubectl -n inferops rollout status deployment/inferops-frontend --timeout=120s

echo
echo "InferOps is running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000/docs"
