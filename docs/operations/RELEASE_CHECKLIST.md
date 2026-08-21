# KANGAYATH WEB — Release Checklist

## Pre-Release

- [ ] All code changes are committed and pushed to `main`
- [ ] `git status` shows clean working tree
- [ ] Backend lint passes: `ruff check apps/api && ruff format --check apps/api`
- [ ] Backend type check passes: `mypy apps/api/app`
- [ ] Backend tests pass: `pytest apps/api/tests -v`
- [ ] Frontend type check passes: `npm run typecheck` in `apps/web`
- [ ] Frontend tests pass: `npm run test` in `apps/web`
- [ ] Frontend build passes: `npm run build` in `apps/web`
- [ ] Zero price guarantee verified in test output
- [ ] No secrets in repository: `git log --diff-filter=A -- '*.env' '*.key' '*.pem'`
- [ ] Production `.env` file prepared with real credentials
- [ ] Database backup completed: `./scripts/backup.sh`

## Deployment

- [ ] Docker images built: `docker compose -f docker-compose.production.yml build`
- [ ] Database migrations applied: `docker compose run --rm api alembic upgrade head`
- [ ] All services started: `docker compose -f docker-compose.production.yml up -d`
- [ ] Wait 30 seconds for services to initialize

## Post-Release Verification

- [ ] Smoke test passes: `./scripts/smoke-test.sh`
- [ ] Health check returns healthy: `curl /health`
- [ ] API health includes database subsystem: `curl /api/v1/health`
- [ ] Customer homepage loads correctly
- [ ] Product catalog displays products
- [ ] Product detail page shows images and variants
- [ ] Visit page shows store hours and map
- [ ] Saved items page works (add/remove)
- [ ] Admin dashboard loads
- [ ] Admin can create/edit products
- [ ] Admin can manage categories
- [ ] Admin can toggle shop status
- [ ] No price fields visible on customer pages
- [ ] `robots.txt` accessible and correct
- [ ] `sitemap.xml` accessible and contains URLs

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
