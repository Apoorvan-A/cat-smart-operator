#!/usr/bin/env bash
# Smoke-check a running stack. Owner: Claude 4.
# Usage: bash scripts/smoke.sh   (start it first with `docker compose up` or the dev servers)
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
ML_URL="${ML_URL:-http://localhost:9000}"

check() {
  local name="$1" url="$2"
  if curl -fsS "$url" >/dev/null 2>&1; then
    echo "OK   $name  ($url)"
  else
    echo "FAIL $name  ($url)"; return 1
  fi
}

echo "Smoke checking stack..."
check "backend /health" "$BACKEND_URL/health"
check "ml /health"      "$ML_URL/health"
echo "All health checks passed."
