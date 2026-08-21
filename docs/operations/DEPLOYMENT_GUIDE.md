# KANGAYATH WEB — Production Deployment Guide

## 1. System Architecture Overview

The KANGAYATH WEB application follows a containerized, decoupled architecture:
- **Frontend**: Next.js 15 (App Router, Server Components + Client Workspaces, Tailwind CSS v4, Lucide Icons)
- **Backend API**: FastAPI (Python 3.12, AsyncPG, SQLAlchemy 2.0 async, Pydantic v2)
- **Primary Database**: PostgreSQL 16 Alpine
- **Reverse Proxy / Ingress**: Nginx / Cloudflare CDN with SSL Termination

```
                       [ Internet Users / Local Customers ]
                                      │
                                      ▼
                        [ Cloudflare / HTTPS Ingress ]
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
            [ Next.js Web Frontend ]        [ FastAPI Backend API ]
             (:3000 Node / Standalone)        (:8000 Gunicorn / Uvicorn)
                        │                           │
                        └─────────────┬─────────────┘
                                      ▼
                           [ PostgreSQL 16 Alpine ]
                                  (:5432)
```

---

## 2. Production Environment Configuration

All production secrets and variables must be supplied via secure environment variables or secret managers (e.g. AWS Secrets Manager, Vault, Doppler).

### Backend (`apps/api/.env.production`)
| Variable | Description | Example |
|---|---|---|
| `APP_ENV` | Environment Mode | `production` |
| `DEBUG` | FastAPI Debug Mode | `false` |
| `DATABASE_URL` | PostgreSQL Async Connection String | `postgresql+asyncpg://kangayath_app:<SECURE_PASSWORD>@db:5432/kangayath_prod` |
| `ALLOWED_ORIGINS` | CORS Whitelist | `https://kangayath.in,https://admin.kangayath.in` |
| `API_V1_PREFIX` | Base Route Prefix | `/api/v1` |
| `LOG_LEVEL` | Log Output Verbosity | `INFO` |

### Frontend (`apps/web/.env.production`)
| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime Node Mode | `production` |
| `NEXT_PUBLIC_SITE_URL` | Canonical Website URL | `https://kangayath.in` |
| `NEXT_PUBLIC_API_URL` | Public API Gateway | `https://api.kangayath.in` |

---

## 3. Containerized Deployment Steps

### 3.1 Build Container Images
```bash
# Build API container image
docker build -t kangayath/api:latest -f apps/api/Dockerfile apps/api

# Build Web container image
docker build -t kangayath/web:latest -f apps/web/Dockerfile apps/web
```

### 3.2 Database Migration Execution
Before deploying updated API containers, always run Alembic migrations:
```bash
docker run --rm \
  --network kangayath_network \
  -e DATABASE_URL="postgresql+asyncpg://kangayath_app:${DB_PASSWORD}@postgres:5432/kangayath_prod" \
  kangayath/api:latest \
  alembic upgrade head
```

### 3.3 Blue-Green / Rolling Deployment
1. Start updated backend container replicas behind the load balancer.
2. Verify liveness probe (`/health`) and readiness probe (`/api/v1/health`).
3. Switch traffic to new backend containers.
4. Deploy frontend Next.js instances.
5. Purge Cloudflare Edge Cache for static assets and HTML.

---

## 4. Zero Price Guarantee Verification

Production smoke tests must verify that no customer-facing endpoint returns pricing:
```bash
# Verify public product detail has no price fields
curl -s https://api.kangayath.in/api/v1/public/products | grep -i "price"
# Expected: Empty response / No price fields
```
