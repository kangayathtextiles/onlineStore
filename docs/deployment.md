# Deployment Guide & Staging / Production Architecture

## 1. Overview

KANGAYATH WEB uses a fully automated, test-gated CI/CD pipeline targeting **Render** via **GitHub Actions**.

The deployment topology strictly isolates **Staging** from **Production**, ensuring zero risk of test data leaking into production or unverified code breaking the live customer catalog.

```text
Developer
   │
   ▼
feature/*
   │
   ▼
Pull Request
   │
   ├── Static checks (Ruff, ESLint, Mypy, TypeScript)
   ├── Backend tests (Pytest + PostgreSQL 16 Service Container)
   ├── Frontend tests (Vitest + React Testing Library)
   ├── Next.js Production Build verification
   └── Docker Image Build verification
   │
   ▼
staging branch
   │
   ├── CI Test Gate passes
   └── Automatic deployment to Render Staging
          │
          ▼
      Render STAGING (kangayath-api-staging / kangayath-web-staging)
          │
          ▼
      Automated Staging Smoke Tests (scripts/smoke-test.sh)
          │
          ▼
      Manual Showroom Owner Verification
          │
          ▼
main branch
   │
   ├── CI Test Gate passes
   └── Automatic deployment to Render Production
          │
          ▼
      Render PRODUCTION (kangayath-api / kangayath-web)
          │
          ▼
      Post-Deploy Production Smoke Verification
```

---

## 2. Environment Architecture & Matrix

| Resource | Staging Environment | Production Environment |
|---|---|---|
| **Git Branch** | `staging` | `main` |
| **Render API Service** | `kangayath-api-staging` | `kangayath-api` |
| **Render Web Service** | `kangayath-web-staging` | `kangayath-web` |
| **Render Database** | `kangayath-db-staging` | `kangayath-db-prod` |
| **Backend Environment** | `ENVIRONMENT=staging` | `ENVIRONMENT=production` |
| **Frontend Public API** | `https://kangayath-api-staging.onrender.com` | `https://kangayath-api.onrender.com` |
| **Frontend Public URL** | `https://kangayath-web-staging.onrender.com` | `https://kangayath-web.onrender.com` |
| **Data Isolation** | Isolated staging database | Production showroom data |

---

## 3. GitHub Actions Secrets Configuration

To enable automated webhook triggers from GitHub Actions, configure the following secrets in **GitHub Repository Settings $\to$ Secrets and variables $\to$ Actions**:

| Secret Name | Description | Source |
|---|---|---|
| `RENDER_STAGING_API_DEPLOY_HOOK` | Deploy hook URL for `kangayath-api-staging` | Render Dashboard $\to$ Service Settings $\to$ Deploy Hook |
| `RENDER_STAGING_WEB_DEPLOY_HOOK` | Deploy hook URL for `kangayath-web-staging` | Render Dashboard $\to$ Service Settings $\to$ Deploy Hook |
| `RENDER_PRODUCTION_API_DEPLOY_HOOK` | Deploy hook URL for `kangayath-api` | Render Dashboard $\to$ Service Settings $\to$ Deploy Hook |
| `RENDER_PRODUCTION_WEB_DEPLOY_HOOK` | Deploy hook URL for `kangayath-web` | Render Dashboard $\to$ Service Settings $\to$ Deploy Hook |
| `STAGING_API_URL` *(Optional)* | Custom staging API URL (default: `https://kangayath-api-staging.onrender.com`) | Render service URL |
| `STAGING_WEB_URL` *(Optional)* | Custom staging Web URL (default: `https://kangayath-web-staging.onrender.com`) | Render service URL |
| `PRODUCTION_API_URL` *(Optional)* | Custom prod API URL (default: `https://kangayath-api.onrender.com`) | Render service URL |
| `PRODUCTION_WEB_URL` *(Optional)* | Custom prod Web URL (default: `https://kangayath-web.onrender.com`) | Render service URL |

> [!NOTE]
> If deploy hook secrets are not configured, Render will still automatically build and deploy if branch auto-deploy is enabled on the Render service dashboard. The GitHub Actions CD workflows will log a clear notice and execute the post-deployment smoke verification.

---

## 4. Render Blueprint Setup (`render.yaml`)

The repository includes a declarative `render.yaml` blueprint defining the complete multi-environment infrastructure:

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\to$ **Blueprint**.
3. Connect the repository `kangayathtextiles/onlineStore`.
4. Render will automatically detect `render.yaml` and provision both Staging and Production databases and web services with matching branch tracking.

---

## 5. Post-Deployment Smoke Verification

Post-deployment smoke testing runs automatically in CD workflows and can also be run locally or against any deployed target:

```bash
# Smoke test against Staging:
./scripts/smoke-test.sh https://kangayath-api-staging.onrender.com https://kangayath-web-staging.onrender.com

# Smoke test against Production:
./scripts/smoke-test.sh https://kangayath-api.onrender.com https://kangayath-web.onrender.com
```

The smoke verification suite validates:
1. **Liveness & Readiness probes**: `/health` and `/api/v1/health` return HTTP 200.
2. **Public Showroom APIs**: `/api/v1/public/store/status`, `/categories`, `/products`, `/attributes/sizes`, `/attributes/colors`, `/sections`.
3. **Zero Price Guarantee**: Confirms no `"price"` keys or values are exposed to public customer endpoints.
4. **Customer Frontend Pages**: `/`, `/products`, `/visit`, `/saved`, `/robots.txt`, `/sitemap.xml`.
5. **Admin & Physical QR Suite**: `/admin`, `/admin/qr/print`, `/admin/qr/scanner`, `/admin/shop`.

---

## 6. Production Rollback Procedure

If a deployment failure or unexpected issue occurs in production:

```text
Production Incident Detected
          │
          ▼
1. Identify Previous Known-Good Release
          │
          ▼
2. Trigger Instant Rollback in Render
   - Open Render Dashboard -> Service (kangayath-api / kangayath-web)
   - Go to 'Events' or 'Deploys' tab
   - Click 'Rollback' on the previous successful deploy
          │
          ▼
3. Revert Commit on Git
   - git revert <bad-commit-sha>
   - git push origin main
          │
          ▼
4. Run Smoke Verification
   - ./scripts/smoke-test.sh https://kangayath-api.onrender.com https://kangayath-web.onrender.com
          │
          ▼
5. Post-Incident Review & Resolution on Staging
```

---

## 7. Troubleshooting & FAQ

### A. Render Free Tier Cold Starts
Render free-tier web services spin down after 15 minutes of inactivity. When receiving the first request, they require 10–30 seconds to spin up. The `smoke-test.sh` script automatically retries with backoff up to 3 times to accommodate cold starts.

### B. In-Container Database Migrations
Database migrations execute automatically on container startup in `Dockerfile`:
```bash
alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000
```
This ensures zero drift between application code and database schema across all deploys.
