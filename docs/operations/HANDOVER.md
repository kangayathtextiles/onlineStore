# KANGAYATH WEB — Handover Package

## 1. Project Overview

KANGAYATH WEB is a **digital showroom platform** for a physical clothing store in Kerala, India. Customers browse products online and purchase in-person at the physical store.

**This is NOT an e-commerce platform.** There is no online payment, checkout, or home delivery.

---

## 2. Repository Structure

```
kangayath-web/
├── apps/
│   ├── api/                    # FastAPI Backend (Python 3.12)
│   │   ├── app/                # Application source code
│   │   │   ├── api/v1/         # API routers (admin/ and public/)
│   │   │   ├── core/           # Configuration, dependencies, security
│   │   │   ├── db/             # Database session management
│   │   │   ├── models/         # SQLAlchemy 2.0 models
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   └── services/       # Business logic layer
│   │   ├── alembic/            # Database migrations
│   │   ├── tests/              # Pytest test suites
│   │   └── Dockerfile          # Production container
│   └── web/                    # Next.js 15 Frontend (TypeScript)
│       ├── app/                # App Router pages
│       │   ├── (customer)/     # Customer-facing pages
│       │   └── admin/          # Admin control center
│       ├── components/         # React components
│       ├── lib/                # API client, utilities
│       ├── types/              # TypeScript type definitions
│       ├── tests/              # Vitest test suites
│       └── Dockerfile          # Production container
├── infrastructure/
│   ├── docker/postgres/        # PostgreSQL initialization
│   └── nginx/                  # Reverse proxy configuration
├── scripts/                    # Operational scripts
│   ├── backup.sh               # Database backup
│   ├── restore.sh              # Database restore
│   ├── deploy.sh               # Production deployment
│   ├── smoke-test.sh           # Post-deployment verification
│   ├── dev.ps1                 # Local development startup
│   └── test.ps1                # Full test suite runner
├── docs/                       # All project documentation
├── docker-compose.yml          # Development environment
└── docker-compose.production.yml  # Production environment
```

---

## 3. Key Business Rules

1. **Zero Price Guarantee**: Product prices are NEVER displayed on the customer website or public API
2. **Physical Store Model**: Customers browse online, purchase physically at the store
3. **No E-Commerce**: No cart, checkout, payment, or delivery features
4. **Deferred Authentication**: Admin auth requires explicit client approval before implementation

---

## 4. Technology Stack

| Component | Technology | Version |
|---|---|---|
| Backend | FastAPI + Uvicorn | Python 3.12 |
| ORM | SQLAlchemy 2.0 (async) | asyncpg driver |
| Database | PostgreSQL | 16 Alpine |
| Migrations | Alembic | Latest |
| Frontend | Next.js App Router | 15.x |
| UI | React 19 + TailwindCSS 3 | TypeScript |
| Container | Docker + Compose | Multi-stage builds |
| Proxy | Nginx | Alpine |
| CI/CD | GitHub Actions | 2 pipelines |

---

## 5. Essential Procedures

| Procedure | Document |
|---|---|
| Deploy to production | [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) |
| Environment variables | [ENVIRONMENT_GUIDE.md](ENVIRONMENT_GUIDE.md) |
| Database migrations | [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) |
| Backup & restore | [BACKUP_RESTORE_RUNBOOK.md](BACKUP_RESTORE_RUNBOOK.md) |
| Release process | [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) |
| Troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Architecture | [ARCHITECTURE_REFERENCE.md](ARCHITECTURE_REFERENCE.md) |

---

## 6. Known Limitations

1. **No admin authentication**: Admin endpoints are unprotected. Must use network-level security (VPN, Cloudflare Access, IP whitelist) until client approves authentication implementation.
2. **Image storage**: Product images are stored as URLs. No built-in image upload/processing pipeline — images must be hosted externally or via a CDN.
3. **Single database**: No read replicas or failover configured.
4. **No CDN**: Static assets served directly from Next.js container.

---

## 7. Pending Client Decisions

| Decision | Impact | Status |
|---|---|---|
| Authentication implementation | Admin security | **Blocked — awaiting client approval** |
| Production domain name | DNS, TLS, CORS | Placeholder: `kangayath.in` |
| Image hosting strategy | Product imagery | Currently URL-based |
| Hosting provider | Infrastructure | Not determined |

---

## 8. Running Tests

```powershell
# Full test suite (Windows)
.\scripts\test.ps1

# Backend only
& "apps/api/.venv/Scripts/pytest.exe" apps/api/tests -v

# Frontend only
cd apps/web && npm run test

# Production build verification
cd apps/web && npm run build
```

---

## 9. Contact & Support

This project was developed through 12 structured phases with complete documentation at every stage. All architectural decisions are recorded in `docs/decisions/ADR-*.md`.
