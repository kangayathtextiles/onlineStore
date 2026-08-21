# KANGAYATH WEB — Database Backup & Disaster Recovery Runbook

## 1. Backup Strategy

To ensure zero data loss for catalogue, taxonomy, store hours, and promotional edits:
- **Daily Full Snapshot**: Automated `pg_dump` compressed snapshot taken every night at 02:00 IST.
- **WAL Archiving**: Continuous PostgreSQL Write-Ahead Log (WAL) archiving for Point-In-Time Recovery (PITR).
- **Retention Policy**:
  - Daily backups: Retained for 30 days.
  - Weekly backups: Retained for 12 weeks.
  - Monthly archives: Retained for 1 year in geo-redundant object storage (S3 / GCS).

---

## 2. Backup Execution Procedures

### 2.1 Automated Nightly Backup Script
```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/kangayath"
BACKUP_FILE="${BACKUP_DIR}/kangayath_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Execute compressed PostgreSQL dump
docker exec -t kangayath_postgres pg_dump \
  -U kangayath \
  -d kangayath \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_FILE}"

echo "[SUCCESS] Backup created at ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Sync to off-site cloud storage
aws s3 cp "${BACKUP_FILE}" "s3://kangayath-db-backups/daily/kangayath_backup_${TIMESTAMP}.sql.gz"
```

---

## 3. Disaster Recovery & Restoration Procedures

### 3.1 Restoring to a Clean Database Instance
1. **Stop Application Backend**:
   ```bash
   docker-compose stop api
   ```
2. **Recreate Clean Target Database**:
   ```bash
   docker exec -i kangayath_postgres dropdb -U kangayath --if-exists kangayath_restored
   docker exec -i kangayath_postgres createdb -U kangayath kangayath_restored
   ```
3. **Decompress and Restore from Snapshot**:
   ```bash
   gunzip -c /var/backups/kangayath/kangayath_backup_TARGET.sql.gz | \
     docker exec -i kangayath_postgres pg_restore \
       -U kangayath \
       -d kangayath_restored \
       --clean \
       --if-exists \
       --no-owner
   ```
4. **Run Migration Check**:
   ```bash
   docker exec -it kangayath_api alembic current
   ```
5. **Restart Backend**:
   ```bash
   docker-compose start api
   ```

### 3.2 Recovery Verification Checklist
- [ ] Database accepts read/write queries.
- [ ] Category tree returns all categories & subcategories.
- [ ] Product catalogue returns published products with valid image URLs.
- [ ] Store operating schedule accurately reflects 7-day shop hours.
- [ ] Price protection invariant verified (no prices exposed).
