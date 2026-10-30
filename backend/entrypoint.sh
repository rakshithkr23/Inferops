#!/bin/sh
# Container start-up: wait for the database, prepare tables, optionally seed
# demo data, then start the API.

set -e

echo "Waiting for the database..."
attempt=0
until python -m app.rag.check_vector_extension >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "Database is not reachable after 60 attempts. Check DATABASE_URL."
    exit 1
  fi
  sleep 2
done
echo "Database is ready."

python -m app.database.init_db
python -m app.rag.init_embeddings

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  python -m app.rag.seed_data
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000

