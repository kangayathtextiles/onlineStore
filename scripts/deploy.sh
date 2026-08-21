#!/usr/bin/env bash
# ==============================================================================
# KANGAYATH WEB — Production Deployment Script
# ==============================================================================
# Usage: ./scripts/deploy.sh
# Sequence: Backup → Build → Migrate → Deploy → Smoke Test
# ==============================================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.production.yml"

echo "============================================"
echo "  KANGAYATH WEB — Production Deployment"
echo "============================================"
echo ""

# Pre-flight checks
echo "[PRE-FLIGHT] Verifying prerequisites..."

if ! command -v docker &> /dev/null; then
  echo "[ERROR] Docker is not installed."
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "[ERROR] Docker daemon is not running."
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "[ERROR] ${COMPOSE_FILE} not found."
  exit 1
fi

echo "[PRE-FLIGHT] All checks passed."
echo ""

# Step 1: Database backup
echo "[1/5] Creating pre-deployment database backup..."
if docker ps --format '{{.Names}}' | grep -q kangayath-postgres; then
  ./scripts/backup.sh ./backups/pre-deploy 2>/dev/null || echo "  (Skipped — no existing database)"
else
  echo "  (Skipped — no running database container)"
fi
echo ""

# Step 2: Build containers
echo "[2/5] Building production container images..."
docker compose -f "${COMPOSE_FILE}" build --no-cache
echo ""

# Step 3: Run database migrations
echo "[3/5] Running database migrations..."
docker compose -f "${COMPOSE_FILE}" up -d postgres
echo "  Waiting for PostgreSQL to be ready..."
sleep 10

docker compose -f "${COMPOSE_FILE}" run --rm api alembic upgrade head
echo ""

# Step 4: Deploy all services
echo "[4/5] Starting all services..."
docker compose -f "${COMPOSE_FILE}" up -d
echo "  Waiting for services to initialize..."
sleep 15
echo ""

# Step 5: Smoke test
echo "[5/5] Running post-deployment smoke test..."
./scripts/smoke-test.sh || {
  echo ""
  echo "[WARNING] Smoke test detected issues."
  echo "Review the output above and decide whether to rollback."
  echo "Rollback command: docker compose -f ${COMPOSE_FILE} down"
}

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "  Services: docker compose -f ${COMPOSE_FILE} ps"
echo "  Logs:     docker compose -f ${COMPOSE_FILE} logs -f"
echo "============================================"
