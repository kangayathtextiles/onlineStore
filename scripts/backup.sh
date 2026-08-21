#!/usr/bin/env bash
# ==============================================================================
# KANGAYATH WEB — PostgreSQL Backup Script
# ==============================================================================
# Usage: ./scripts/backup.sh [backup_directory]
# Default backup directory: ./backups
# ==============================================================================
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${1:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/kangayath_backup_${TIMESTAMP}.sql.gz"

# Container name
CONTAINER="${POSTGRES_CONTAINER:-kangayath-postgres}"
DB_USER="${POSTGRES_USER:-kangayath_user}"
DB_NAME="${POSTGRES_DB:-kangayath_db}"

echo "============================================"
echo "  KANGAYATH WEB — Database Backup"
echo "============================================"
echo "Timestamp: ${TIMESTAMP}"
echo "Container: ${CONTAINER}"
echo "Database:  ${DB_NAME}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Execute backup
echo "[1/3] Creating compressed database dump..."
docker exec -t "${CONTAINER}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[2/3] Backup created: ${BACKUP_FILE} (${FILESIZE})"

# Cleanup old backups (retain last 30 days)
echo "[3/3] Cleaning up backups older than 30 days..."
find "${BACKUP_DIR}" -name "kangayath_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

echo ""
echo "============================================"
echo "  Backup completed successfully!"
echo "  File: ${BACKUP_FILE}"
echo "  Size: ${FILESIZE}"
echo "============================================"
