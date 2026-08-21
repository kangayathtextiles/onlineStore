# KANGAYATH WEB

Digital showroom and product-discovery platform for Kangayath Clothing Store — a physical retail shop in Kerala, India. Customers browse products online and purchase in-person at the store.

**Version**: 1.0.0 | **Status**: Production Release Candidate

---

## 🏛️ Project Governance & Architecture

- **Engineering Constitution**: [docs/GOVERNANCE.md](docs/GOVERNANCE.md)
- **Architecture Reference**: [docs/operations/ARCHITECTURE_REFERENCE.md](docs/operations/ARCHITECTURE_REFERENCE.md)
- **Architecture Decision Records**: [docs/decisions/](docs/decisions/)
- **Security Baseline**: [docs/security/baseline.md](docs/security/baseline.md)

---

## 📂 Repository Structure

```text
kangayath-web/
├── apps/
│   ├── api/            # Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2
│   └── web/            # Next.js 15, TypeScript, React 19, TailwindCSS
├── infrastructure/
│   ├── docker/         # PostgreSQL init scripts
│   └── nginx/          # Reverse proxy configuration
├── docs/               # Architecture, operations, decisions, security
├── scripts/            # Development, testing, deployment, backup scripts
└── .github/workflows/  # CI/CD pipelines
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** | **Node.js 20+** | **Docker & Docker Compose**

### Development Setup
```bash
# 1. Clone and setup environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 2. Launch via Docker Compose (development)
docker-compose up

# 3. Or run services manually
# Backend: cd apps/api && pip install -e ".[dev]" && uvicorn app.main:app --reload
# Frontend: cd apps/web && npm install && npm run dev
```

### Endpoints
| Service | URL |
|---|---|
| Customer Website | http://localhost:3000 |
| Admin Dashboard | http://localhost:3000/admin |
| API Server | http://localhost:8000 |
| API Docs (dev) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

### Running Tests
```powershell
.\scripts\test.ps1
```

---

## 🚢 Production Deployment

See [docs/operations/PRODUCTION_DEPLOYMENT.md](docs/operations/PRODUCTION_DEPLOYMENT.md) for complete deployment instructions.

```bash
# Quick production deploy
docker compose -f docker-compose.production.yml up -d --build
```

---

## 📋 Development Phases

- [x] Phase 01: Foundation & Project Governance
- [x] Phase 02: Product Requirements & Domain Specification
- [x] Phase 03: Technical Architecture
- [x] Phase 04: Database & Data Layer
- [x] Phase 05: Backend Core & API Implementation
- [x] Phase 06: Admin Control Center Frontend
- [x] Phase 07: Customer Digital Showroom Frontend
- [x] Phase 08: Full-System Integration & QA
- [x] Phase 09: Structured Data, SEO & System Resilience
- [x] Phase 10: Final Integration & Release Candidate Validation
- [x] Phase 11: Final System Verification & QA Hardening
- [x] Phase 12: Production Readiness, Deployment & Handover

---

## 📖 Key Documentation

| Document | Path |
|---|---|
| Deployment Guide | [docs/operations/PRODUCTION_DEPLOYMENT.md](docs/operations/PRODUCTION_DEPLOYMENT.md) |
| Environment Guide | [docs/operations/ENVIRONMENT_GUIDE.md](docs/operations/ENVIRONMENT_GUIDE.md) |
| Migration Guide | [docs/operations/DATABASE_MIGRATIONS.md](docs/operations/DATABASE_MIGRATIONS.md) |
| Backup & Restore | [docs/operations/BACKUP_RESTORE_RUNBOOK.md](docs/operations/BACKUP_RESTORE_RUNBOOK.md) |
| Release Checklist | [docs/operations/RELEASE_CHECKLIST.md](docs/operations/RELEASE_CHECKLIST.md) |
| Troubleshooting | [docs/operations/TROUBLESHOOTING.md](docs/operations/TROUBLESHOOTING.md) |
| Handover Package | [docs/operations/HANDOVER.md](docs/operations/HANDOVER.md) |

