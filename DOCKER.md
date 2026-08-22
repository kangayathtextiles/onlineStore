# KANGAYATH WEB — Docker Desktop Local Development Guide

This guide provides complete instructions for running the **KANGAYATH WEB** full stack (PostgreSQL, FastAPI Backend, and Next.js Digital Showroom & Admin Console) locally using **Docker Desktop on Windows**.

---

## 1. System Requirements

* **Operating System**: Windows 10/11 (64-bit) with WSL2 enabled.
* **Docker**: Docker Desktop 4.x+ (WSL2 backend).
* **RAM**: Minimum 4 GB free RAM allocated to Docker.
* **Shell**: Windows PowerShell or Command Prompt.

---

## 2. Architecture Overview

```text
                    Windows Desktop
                          │
                     Docker Desktop
                          │
            ┌─────────────┴─────────────┐
            │   kangayath-network (bridge)│
            │                           │
    ┌───────▼────────┐          ┌───────▼────────┐
    │  kangayath-web │          │  kangayath-api │
    │    Next.js     │── HTTP ──│    FastAPI     │
    │  (Port 3000)   │ (Browser)│  (Port 8000)   │
    └────────────────┘          └───────┬────────┘
     /      (Customer)                  │ asyncpg
     /admin (Admin)             ┌───────▼────────┐
                                │ kangayath-     │
                                │   postgres     │
                                │ (Port 5433:5432)│
                                └───────┬────────┘
                                        │
                                ┌───────▼────────┐
                                │ postgres_data  │
                                │ (Named Volume) │
                                └────────────────┘
```

### Services & Port Mappings

| Service | Container Name | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `kangayath-postgres` | `5432` | `5433` | Relational database (Port `5433` avoids collisions with host PostgreSQL). |
| **FastAPI API** | `kangayath-api` | `8000` | `8000` | REST API backend with auto-migrations and media serving. |
| **Next.js Web** | `kangayath-web` | `3000` | `3000` | Customer digital showroom (`/`) and Admin console (`/admin`). |

---

## 3. Quick Start (Single Command)

### Step 1: Clone and Navigate to the Repository
```powershell
cd "C:\Users\akr26\OneDrive\Documents\kangayath Web"
```

### Step 2: Ensure Root `.env` is Configured
If not present, copy from the template:
```powershell
cp .env.example .env
```

### Step 3: Build and Start All Containers
```powershell
docker compose up -d --build
```

### Step 4: Verify Container Status
```powershell
docker compose ps
```
Expected output:
```text
NAME                 IMAGE                  COMMAND                  SERVICE      STATUS                    PORTS
kangayath-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres     Up (healthy)              0.0.0.0:5433->5432/tcp
kangayath-api        kangayath-web-api      "sh -c 'alembic upgr…"   api          Up (healthy)              0.0.0.0:8000->8000/tcp
kangayath-web        kangayath-web-web      "npm run dev"            web          Up                        0.0.0.0:3000->3000/tcp
```

---

## 4. Accessing Application Endpoints

| Application | URL | Description |
| :--- | :--- | :--- |
| **Customer Digital Showroom** | `http://localhost:3000` | Catalog browsing, product variations, store info, WhatsApp inquiry. |
| **Admin Control Center** | `http://localhost:3000/admin` | Product catalog management, categories, size/color attributes, store status. |
| **Interactive API Documentation** | `http://localhost:8000/docs` | Swagger UI for all `/api/v1/public` and `/api/v1/admin` endpoints. |
| **Alternative API Documentation** | `http://localhost:8000/redoc` | ReDoc API specifications. |
| **API Health Probe** | `http://localhost:8000/health` | Liveness / readiness JSON status. |
| **Database (Host Access)** | `localhost:5433` | Connect with DBeaver, pgAdmin, or psql. |

---

## 5. Daily Development Commands

### Streaming Logs
Stream logs for all services:
```powershell
docker compose logs -f
```

Stream logs for a specific service:
```powershell
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f web
```

### Stopping the Stack
```powershell
docker compose down
```

### Restarting Services
```powershell
docker compose restart
```

### Rebuilding Images after Dependency Updates
```powershell
docker compose build --no-cache
docker compose up -d
```

---

## 6. Database Operations

### Connecting from Host Tools (DBeaver / pgAdmin / psql)
* **Host**: `localhost` or `127.0.0.1`
* **Port**: `5433`
* **Database**: `kangayath_db`
* **Username**: `kangayath_user`
* **Password**: `kangayath_dev_password`

```powershell
# Using psql from host:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U kangayath_user -d kangayath_db
```

### Running Migrations Manually
Alembic migrations run automatically on API startup. To run them manually inside the container:
```powershell
docker compose exec api alembic upgrade head
```

### Re-seeding Development Data
```powershell
docker compose exec api python -m app.db.seed
```

### Database Reset (DEVELOPMENT ONLY — DESTROYS DATA)
> [!CAUTION]
> This command completely destroys all local development database records, tables, and volumes.
```powershell
# 1. Stop all containers and remove persistent volumes
docker compose down -v

# 2. Rebuild and start fresh
docker compose up -d --build
```

---

## 7. Environment Variables Reference

| Variable | Description | Safe Default / Local | Docker Internal |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime mode | `development` | `development` |
| `DEBUG` | Verbose error mode | `false` | `false` |
| `SECRET_KEY` | JWT/HMAC token signing key | `CHANGEME-dev-only-insecure-key` | Redacted in production |
| `POSTGRES_SERVER` | PostgreSQL hostname | `localhost` (host) | `postgres` (container) |
| `POSTGRES_PORT` | PostgreSQL port | `5433` (host) | `5432` (container) |
| `POSTGRES_USER` | Database username | `kangayath_user` | `kangayath_user` |
| `POSTGRES_PASSWORD` | Database password | `kangayath_dev_password` | Redacted in production |
| `POSTGRES_DB` | Database name | `kangayath_db` | `kangayath_db` |
| `DATABASE_URL` | Full async connection URI | `postgresql+asyncpg://...:5433/...` | `postgresql+asyncpg://...:5432/...` |
| `BACKEND_CORS_ORIGINS`| Allowed browser origins | `["http://localhost:3000","http://127.0.0.1:3000"]` | Same |
| `NEXT_PUBLIC_API_URL` | Browser-reachable API URL | `http://localhost:8000` | Same |
| `MEDIA_ROOT` | Image uploads filesystem root | `./media` | `/app/media` |

---

## 8. Troubleshooting

### Port 5433 Already in Use
If port `5433` is occupied by another process:
1. Identify the process:
   ```powershell
   Get-NetTCPConnection -LocalPort 5433
   ```
2. Modify `POSTGRES_EXTERNAL_PORT` in `.env` to another port (e.g. `5434`).

### CORS Preflight Errors
Ensure `BACKEND_CORS_ORIGINS` in `.env` matches the origin loaded in your browser (`http://localhost:3000` or `http://127.0.0.1:3000`).

### Hot Reloading Not Triggering
If file changes in `apps/web` or `apps/api` do not update immediately, verify Docker Desktop file-sharing settings (WSL2 integration enabled for your drive).
