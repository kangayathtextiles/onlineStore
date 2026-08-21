# KANGAYATH WEB — Production Deployment Playbook

## 1. Pre-Deployment Checklist

- [ ] All tests pass (`./scripts/test.ps1`)
- [ ] Next.js production build compiles cleanly (`npm run build` in `apps/web`)
- [ ] No secrets committed to repository (`git log --diff-filter=A -- '*.env'`)
- [ ] Production `.env` file prepared with real credentials
- [ ] Database backup taken
- [ ] Docker images build successfully
- [ ] DNS configured (if first deployment)
- [ ] TLS certificates ready (if first deployment)

---

## 2. Environment Variable Reference

### Backend (`apps/api`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | Yes | `development` | `development` / `test` / `staging` / `production` |
| `DEBUG` | No | `false` | Enable debug mode (MUST be `false` in production) |
| `SECRET_KEY` | **Yes** | dev fallback | 64+ char random string. Generate: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `LOG_LEVEL` | No | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `API_HOST` | No | `0.0.0.0` | Server bind address |
| `API_PORT` | No | `8000` | Server port |
| `BACKEND_CORS_ORIGINS` | **Yes** | localhost | Comma-separated or JSON list of allowed origins |
| `POSTGRES_SERVER` | **Yes** | `localhost` | PostgreSQL hostname |
| `POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `POSTGRES_USER` | **Yes** | — | Database username |
| `POSTGRES_PASSWORD` | **Yes** | — | Database password |
| `POSTGRES_DB` | **Yes** | — | Database name |
| `DATABASE_URL` | No | constructed | Full async connection string (overrides individual PG vars) |
| `DB_POOL_SIZE` | No | `5` | Connection pool size |
| `DB_MAX_OVERFLOW` | No | `10` | Max temporary connections |
| `DB_POOL_TIMEOUT` | No | `30` | Pool wait timeout (seconds) |
| `MEDIA_ROOT` | No | `./media` | File upload storage path |
| `MAX_UPLOAD_SIZE_MB` | No | `10` | Maximum upload size |

### Frontend (`apps/web`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8000` | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | `http://localhost:3000` | Canonical site URL (used in SEO, sitemap, robots.txt) |
| `NEXT_PUBLIC_APP_NAME` | No | `Kangayath Web` | Application display name |

---

## 3. Deployment Steps

### 3.1 First-Time Deployment

```bash
# 1. Clone repository
git clone <repo-url> kangayath-web && cd kangayath-web

# 2. Create production .env
cp .env.example .env
# Edit .env with production values

# 3. Run deployment
chmod +x scripts/*.sh
./scripts/deploy.sh
```

### 3.2 Subsequent Deployments

```bash
# 1. Pull latest code
git pull origin main

# 2. Deploy (backup → build → migrate → deploy → test)
./scripts/deploy.sh
```

### 3.3 Manual Deployment

```bash
# 1. Pre-deployment backup
./scripts/backup.sh

# 2. Build images
docker compose -f docker-compose.production.yml build

# 3. Run migrations
docker compose -f docker-compose.production.yml run --rm api alembic upgrade head

# 4. Start services
docker compose -f docker-compose.production.yml up -d

# 5. Verify
./scripts/smoke-test.sh
```

---

## 4. Post-Deployment Verification

```bash
# Run full smoke test
./scripts/smoke-test.sh

# Verify health
curl https://your-domain.com/health
curl https://your-domain.com/api/v1/health

# Verify zero price guarantee
curl -s https://your-domain.com/api/v1/public/products | grep -i price
# Expected: No output (no price fields)
```

---

## 5. Rollback Procedure

```bash
# 1. Stop current deployment
docker compose -f docker-compose.production.yml down

# 2. Restore database from pre-deployment backup
./scripts/restore.sh ./backups/pre-deploy/kangayath_backup_<TIMESTAMP>.sql.gz

# 3. Deploy previous version
git checkout <previous-commit>
docker compose -f docker-compose.production.yml up -d --build
```

---

## 6. Security Notes

> **CRITICAL**: Admin authentication is NOT implemented per explicit client mandate. Admin endpoints (`/api/v1/admin/*` and `/admin/*`) MUST be protected via network-level access control:
> - Cloudflare Access
> - VPN-only access
> - HTTP Basic Auth at nginx level
> - IP whitelisting

This is documented in [ADR-0010](../decisions/ADR-0010-deferred-authentication-boundary.md).
