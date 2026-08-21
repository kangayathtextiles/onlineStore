# KANGAYATH WEB — Troubleshooting Guide

## 1. Application Won't Start

### Backend (FastAPI)

**Symptom**: `uvicorn` fails to start or crashes immediately.

**Common Causes**:
- Missing `.env` file: Copy from `.env.example`
- Invalid `DATABASE_URL`: Verify PostgreSQL is running and credentials are correct
- Port already in use: Change `API_PORT` or stop the conflicting process
- Missing Python dependencies: Run `pip install -e ".[dev]"` in `apps/api`

**Diagnosis**:
```bash
# Check if PostgreSQL is accessible
docker exec kangayath-postgres pg_isready

# Check API logs
docker logs kangayath-api --tail 50

# Test database connectivity manually
python -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('postgresql://...'))"
```

### Frontend (Next.js)

**Symptom**: `next dev` or `next start` fails.

**Common Causes**:
- Missing `node_modules`: Run `npm install` in `apps/web`
- Missing `NEXT_PUBLIC_API_URL`: Check `.env.local` file
- Build errors: Run `npm run build` to see specific compilation errors
- Port conflict: Change the port or stop the conflicting process

---

## 2. Database Issues

### Cannot Connect to PostgreSQL

```bash
# Check if container is running
docker ps | grep kangayath-postgres

# Check container health
docker inspect kangayath-postgres --format='{{.State.Health.Status}}'

# Check PostgreSQL logs
docker logs kangayath-postgres --tail 30

# Verify connection from host
psql -h localhost -U kangayath_user -d kangayath_db
```

### Migration Fails

```bash
# Check current migration state
cd apps/api && alembic current

# Check migration history
alembic history

# If stuck, check for pending transactions
docker exec kangayath-postgres psql -U kangayath_user -d kangayath_db \
  -c "SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';"
```

---

## 3. API Returns 500 Errors

**Diagnosis**:
1. Check `X-Request-ID` header in the error response
2. Search API logs for that request ID
3. Look for stack traces in `docker logs kangayath-api`

**Common Causes**:
- Database connection pool exhausted → Increase `DB_POOL_SIZE`
- Unhandled exception in service layer → Check application logs
- Missing required database records → Run seed script

---

## 4. Customer Website Shows "Connecting API..."

**Cause**: Frontend cannot reach the backend API.

**Fix**:
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Verify the API container is running and healthy
3. Check CORS configuration matches the frontend origin
4. If behind nginx, verify proxy configuration routes `/api/` correctly

---

## 5. Images Not Loading

**Causes**:
- Image URLs point to expired/invalid paths
- CORS blocking image requests from external domains
- nginx not configured to serve media files

**Fix**:
- Verify image URLs in the database are valid
- Add the image hosting domain to `next.config.ts` `images.remotePatterns`
- Ensure media volume is mounted correctly in Docker

---

## 6. Health Check Failures

```bash
# Test health endpoints
curl -v http://localhost:8000/health
curl -v http://localhost:8000/api/v1/health

# Check for "degraded" status indicating database issues
curl -s http://localhost:8000/api/v1/health | python -m json.tool
```

If health returns "degraded":
- Database is unreachable → Check PostgreSQL container
- Connection pool exhausted → Restart API container

---

## 7. Docker Container Issues

### Container Keeps Restarting

```bash
# Check container logs
docker logs kangayath-api --tail 100

# Check container resource usage
docker stats kangayath-api

# Check if OOM killed
docker inspect kangayath-api --format='{{.State.OOMKilled}}'
```

### Build Fails

```bash
# Rebuild with no cache
docker compose -f docker-compose.production.yml build --no-cache

# Check for disk space issues
docker system df
docker system prune -f
```
