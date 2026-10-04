# KANGAYATH WEB — Release Checklist

## Pre-Release

- [x] All code changes are committed and pushed to `main`
- [x] `git status` shows clean working tree
- [x] Backend lint passes: `ruff check apps/api && ruff format --check apps/api`
- [x] Backend type check passes: `mypy apps/api/app`
- [x] Backend tests pass: `pytest apps/api/tests -v`
- [x] Frontend type check passes: `npm run typecheck` in `apps/web`
- [x] Frontend tests pass: `npm run test` in `apps/web`
- [x] Frontend build passes: `npm run build` in `apps/web`
- [x] Zero price guarantee verified in test output
- [x] No secrets in repository: `git log --diff-filter=A -- '*.env' '*.key' '*.pem'`
- [x] Production `.env` file prepared with real credentials
- [x] Database backup completed: `./scripts/backup.sh`

## Deployment

- [x] Docker images built: `docker compose -f docker-compose.production.yml build`
- [x] Database migrations applied: `docker compose run --rm api alembic upgrade head`
- [x] All services started: `docker compose -f docker-compose.production.yml up -d`
- [x] Wait 30 seconds for services to initialize

## Post-Release Verification

- [x] Smoke test passes: `./scripts/smoke-test.sh`
- [x] Health check returns healthy: `curl /health`
- [x] API health includes database subsystem: `curl /api/v1/health`
- [x] Customer homepage loads correctly
- [x] Product catalog displays products
- [x] Product detail page shows images and variants
- [x] Visit page shows store hours and map
- [x] Saved items page works (add/remove)
- [x] Admin dashboard loads
- [x] Admin can create/edit products
- [x] Admin can manage categories
- [x] Admin can toggle shop status
- [x] No price fields visible on customer pages
- [x] `robots.txt` accessible and correct
- [x] `sitemap.xml` accessible and contains URLs

## Rollback Trigger Conditions

Immediately rollback if:
- Health check returns unhealthy
- Customer homepage returns 500
- Database migration failed
- Price fields detected in any customer-facing response
- Admin endpoints return unexpected errors

## Rollback Procedure

```bash
# 1. Stop current deployment
docker compose -f docker-compose.production.yml down

# 2. Restore database
./scripts/restore.sh ./backups/pre-deploy/<latest-backup>.sql.gz

# 3. Deploy previous version
git checkout <previous-tag>
docker compose -f docker-compose.production.yml up -d --build

# 4. Verify
./scripts/smoke-test.sh
```
