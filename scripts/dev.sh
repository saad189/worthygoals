#!/usr/bin/env bash
set -e

ensure_container() {
  local name=$1
  local run_cmd=$2

  if docker ps --filter "name=^${name}$" --filter "status=running" --format "{{.Names}}" | grep -q "^${name}$"; then
    echo "  ✓ ${name} already running"
  elif docker ps -a --filter "name=^${name}$" --format "{{.Names}}" | grep -q "^${name}$"; then
    echo "  → starting stopped container: ${name}"
    docker start "${name}"
  else
    echo "  → creating container: ${name}"
    eval "${run_cmd}"
  fi
}

echo ""
echo "Worthy Goals — local dev"
echo "─────────────────────────"

if ! docker info > /dev/null 2>&1; then
  echo "  ✗ Docker is not running — open Docker Desktop first"
  exit 1
fi

ensure_container "wg-pg" \
  "docker run --name wg-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d pgvector/pgvector:pg16"

ensure_container "worthygoals-redis" \
  "docker run --name worthygoals-redis -p 6379:6379 -d redis:7-alpine"

echo ""
echo "  Starting backend (NODE_ENV=local)…"
echo ""

cd "$(dirname "$0")/../worthygoals-backend"
npm run start:local
