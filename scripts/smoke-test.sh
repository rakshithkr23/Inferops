#!/usr/bin/env bash
# End-to-end smoke test for a running InferOps backend.
# Usage: ./scripts/smoke-test.sh [BASE_URL]
# Set RUN_RCA=true to also call /rca/analyze (needs a working Gemini key).
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
RUN_RCA="${RUN_RCA:-false}"

# The application protects operational API routes with an authenticated session.
# Create a uniquely named CI-only account for this run and reuse its cookie.
CI_RUN_ID="${GITHUB_RUN_ID:-$(date +%s)}"
CI_RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:-1}"
CI_UNIQUE_ID=$((CI_RUN_ID + CI_RUN_ATTEMPT * 100000000))
CI_SUFFIX=$((CI_UNIQUE_ID % 1000000000))
CI_PHONE="9$(printf '%09d' "$CI_SUFFIX")"
# Use example.com: reserved domains such as .test are rejected by email-validator.
CI_EMAIL="ci${CI_UNIQUE_ID}@example.com"
CI_PASSWORD="CI-Smoke-${CI_UNIQUE_ID}-A1!"
COOKIE_JAR="$(mktemp)"
REGISTER_RESPONSE="$(mktemp)"
trap 'rm -f "$COOKIE_JAR" "$REGISTER_RESPONSE"' EXIT

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

register_payload=$(printf \
  '{"full_name":"CI Smoke Test","phone_number":"%s","email":"%s","password":"%s","confirm_password":"%s"}' \
  "$CI_PHONE" "$CI_EMAIL" "$CI_PASSWORD" "$CI_PASSWORD")

# Keep the response body so FastAPI's validation details are visible in CI logs.
if register_status=$(curl -sS -o "$REGISTER_RESPONSE" -w '%{http_code}' \
  -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_payload"); then
  :
else
  register_status="000"
fi

if [ "$register_status" != "201" ]; then
  echo "FAIL: temporary CI account registration returned HTTP $register_status"
  echo "Registration response:"
  cat "$REGISTER_RESPONSE"
  echo
  exit 1
fi
echo "PASS: temporary CI account registration"

login_payload=$(printf '{"identifier":"%s","password":"%s"}' "$CI_EMAIL" "$CI_PASSWORD")
if ! curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "$login_payload" >/dev/null; then
  echo "FAIL: CI smoke-test account login failed"
  exit 1
fi
echo "PASS: authenticated session"

count=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/historical-incidents" \
  | grep -o '"incident_type"' | wc -l | tr -d ' ')
if [ "$count" -ge 3 ]; then
  echo "PASS: $count historical incidents loaded"
else
  echo "FAIL: expected at least 3 historical incidents, found $count"
  exit 1
fi

resp=$(curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"payment service cannot connect to the database","limit":3}')
if echo "$resp" | grep -Eq '"total_results"[[:space:]]*:[[:space:]]*[1-9]'; then
  echo "PASS: vector similarity search"
else
  echo "FAIL: similarity search returned no results: $resp"
  exit 1
fi

if [ "$RUN_RCA" = "true" ]; then
  resp=$(curl -sS --max-time 120 -b "$COOKIE_JAR" -X POST "$BASE_URL/rca/analyze" \
    -H "Content-Type: application/json" \
    -d '{"incident_type":"high_cpu","service_name":"payments-api","severity":"high","description":"CPU at 95% for 10 minutes after deploy, latency rising"}' || true)
  if echo "$resp" | grep -q '"probable_root_cause"'; then
    echo "PASS: /rca/analyze returned an analysis"
  else
    # Gemini quota or latency problems should not block a deployment.
    echo "WARN: /rca/analyze did not return an analysis: $resp"
  fi
fi

echo "Smoke test finished."
