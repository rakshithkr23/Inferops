#!/usr/bin/env bash
# Quick end-to-end check of a running InferOps backend.
# Usage:  ./scripts/smoke-test.sh [BASE_URL]
# Set RUN_RCA=true to also call /rca/analyze (needs a working Gemini key).
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
RUN_RCA="${RUN_RCA:-false}"

echo "Waiting for $BASE_URL/health ..."
for i in $(seq 1 60); do
  if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "FAIL: backend did not become healthy"
    exit 1
  fi
  sleep 5
done
echo "PASS: /health"

curl -fsS "$BASE_URL/" | grep -q '"InferOps"' \
  && echo "PASS: root endpoint" \
  || { echo "FAIL: root endpoint"; exit 1; }

count=$(curl -fsS "$BASE_URL/historical-incidents" | grep -o '"incident_type"' | wc -l)
if [ "$count" -ge 3 ]; then
  echo "PASS: $count historical incidents loaded"
else
  echo "FAIL: expected at least 3 historical incidents, found $count"
  exit 1
fi

resp=$(curl -fsS -X POST "$BASE_URL/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"payment service cannot connect to the database","limit":3}')
if echo "$resp" | grep -q '"total_results":[1-9]'; then
  echo "PASS: vector similarity search"
else
  echo "FAIL: similarity search returned no results: $resp"
  exit 1
fi

if [ "$RUN_RCA" = "true" ]; then
  resp=$(curl -sS --max-time 120 -X POST "$BASE_URL/rca/analyze" \
    -H "Content-Type: application/json" \
    -d '{"incident_type":"high_cpu","service_name":"payments-api","severity":"high","description":"CPU at 95% for 10 minutes after deploy, latency rising"}' || true)
  if echo "$resp" | grep -q '"probable_root_cause"'; then
    echo "PASS: /rca/analyze returned an analysis"
  else
    # Gemini quota or latency problems should not block a deployment
    echo "WARN: /rca/analyze did not return an analysis: $resp"
  fi
fi

echo "Smoke test finished."
