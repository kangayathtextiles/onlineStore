#!/usr/bin/env bash
# ==============================================================================
# KANGAYATH WEB — PostgreSQL Restore Script
# ==============================================================================
# Usage: ./scripts/restore.sh <backup_file>
# ==============================================================================
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Example: $0 ./backups/kangayath_backup_20260821_020000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="${POSTGRES_CONTAINER:-kangayath-postgres}"
DB_USER="${POSTGRES_USER:-kangayath_user}"
DB_NAME="${POSTGRES_DB:-kangayath_db}"

echo "============================================"
echo "  KANGAYATH WEB — Database Restore"
echo "============================================"
echo "Backup file: ${BACKUP_FILE}"
echo "Container:   ${CONTAINER}"
echo "Database:    ${DB_NAME}"
echo ""

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Confirmation
echo "WARNING: This will overwrite the current database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

# Step 1: Stop API to prevent concurrent writes
echo "[1/5] Stopping API container..."
docker stop kangayath-api 2>/dev/null || true

# Step 2: Drop and recreate database
echo "[2/5] Recreating database..."
docker exec -t "${CONTAINER}" dropdb -U "${DB_USER}" --if-exists "${DB_NAME}"
docker exec -t "${CONTAINER}" createdb -U "${DB_USER}" "${DB_NAME}"

# Step 3: Restore from backup
echo "[3/5] Restoring from backup..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" pg_restore \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  2>/dev/null || true

# Step 4: Verify migration state
echo "[4/5] Checking migration state..."
docker exec -t kangayath-api alembic current 2>/dev/null || echo "  (API container not running — verify manually after restart)"

# Step 5: Restart API
echo "[5/5] Restarting API container..."
docker start kangayath-api 2>/dev/null || true

echo ""
echo "============================================"
echo "  Restore completed!"
echo "  Please verify data integrity:"
echo "  - curl http://localhost:8000/api/v1/health"
echo "  - curl http://localhost:8000/api/v1/public/categories"
echo "============================================"
