# KANGAYATH WEB

Digital showroom and product-discovery platform for Kangayath Clothing Store — a physical retail shop in Kerala, India. Customers browse products online and purchase in-person at the physical store.

**Version**: 0.1.0 | **Status**: Production Release Candidate

---

## 🏛️ Project Governance & Architecture

- **Agent Operating Instructions**: [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md)
- **Current Drawbacks Review**: [docs/PROJECT_DRAWBACKS.md](docs/PROJECT_DRAWBACKS.md)
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
│   └── web/            # Next.js 15, TypeScript, React 19, TailwindCSS v3
├── infrastructure/
│   ├── docker/         # PostgreSQL initialization scripts
│   └── nginx/          # Reverse proxy configuration
├── docs/               # Architecture, operations, decisions, security & drawbacks
├── scripts/            # Development, testing, deployment, backup & clone scripts
└── .github/workflows/  # CI/CD pipelines
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** | **Node.js 20+** | **Docker & Docker Compose**

### Development Setup
```bash
# 1. Clone and setup environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 2. Launch via Docker Compose (development stack)
docker compose up

# 3. Or launch via PowerShell helper
.\scripts\dev.ps1

# 4. Or run services manually:
# Backend: cd apps/api && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
# Frontend: cd apps/web && npm install && npm run dev
```

### Endpoints
| Service | URL | Notes |
|---|---|---|
| Customer Website | http://localhost:3000 | Public Showroom & Product Catalog |
| Admin Login Portal | http://localhost:3000/admin/login | Admin Authentication |
| Admin Dashboard | http://localhost:3000/admin | Protected Control Center (Requires Session) |
| API Server | http://localhost:8000 | FastAPI Application |
| API Documentation | http://localhost:8000/docs | Swagger UI (development only) |
| Health Check | http://localhost:8000/health | Liveness & Connection Pool Probe |

---

## 🧪 Running Tests & Quality Verification

### PowerShell (Windows)
Runs complete lint, typecheck, and unit test suites across API and Web:
```powershell
.\scripts\test.ps1
```

### Bash / Linux / CI
```bash
# Backend lint, static typing & pytest:
ruff check apps/api
ruff format --check apps/api
mypy apps/api/app
pytest apps/api/tests

# Frontend static typing & vitest:
npm --prefix apps/web run typecheck
npm --prefix apps/web run test
```

### Post-Deployment Health & Smoke Verification
Executes 24 automated checks covering health probes, public catalog APIs, zero-ecommerce protection, customer routes, Next.js server-side route guards, and API router guards:
```bash
./scripts/smoke-test.sh [API_URL] [WEB_URL]
```

---

## 🚀 CI/CD & Multi-Environment Deployment

KANGAYATH WEB operates an automated, test-gated CI/CD pipeline targeting **Render** via **GitHub Actions**:

```text
feature/* ──(PR)──> staging ──(Render Staging)──> main ──(Render Production)
```

| Environment | Branch | Web Application | Backend API | Database |
|---|---|---|---|---|
| **Staging** | `staging` | https://kangayath-web-staging.onrender.com | https://kangayath-api-staging.onrender.com | `kangayath-db-staging` |
| **Production** | `main` | https://kangayath-web.onrender.com | https://kangayath-api.onrender.com | `kangayath-db-prod` |

Complete documentation:
- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)
- **Testing Strategy**: [docs/testing.md](docs/testing.md)
- **Development Workflows**: [docs/development.md](docs/development.md)

---

## 🚢 Production Deployment

See [docs/deployment.md](docs/deployment.md) for complete deployment instructions.

```bash
# Quick production deploy via Docker Compose:
docker compose -f docker-compose.production.yml up -d --build

# Run post-deployment smoke test:
./scripts/smoke-test.sh
```

---

## 🛠️ Operational & Developer Scripts

All operational and maintenance scripts reside in `scripts/`:

| Script | Environment | Description |
|---|---|---|
| `scripts/dev.ps1` | PowerShell | Checks Docker and launches local dev stack |
| `scripts/test.ps1` | PowerShell | Runs complete lint, typecheck, and test suites |
| `scripts/smoke-test.sh` | Bash | 24-point end-to-end health and smoke verification suite |
| `scripts/clone_db.ps1` | PowerShell | Securely clones Production database to Staging |
| `scripts/backup.sh` | Bash | Automated PostgreSQL schema and data backup |
| `scripts/restore.sh` | Bash | Validated PostgreSQL database restore utility |
| `scripts/deploy.sh` | Bash | Production deployment execution script |
| `scripts/wait-for-render-deploy.sh` | Bash | Polls Render API until deployment completes |

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
- [x] Phase 13: QR Code Physical Identification & Product Lifecycle Management
- [x] Phase 14: CI/CD Pipeline & Dedicated Staging Environment
- [x] Phase 15: Admin Security Hardening & Session Authentication Suite

---

## 📖 Key Documentation

| Document | Path | Description |
|---|---|---|
| Drawbacks Review | [docs/PROJECT_DRAWBACKS.md](docs/PROJECT_DRAWBACKS.md) | Release blockers and technical debt audit |
| Engineering Constitution | [docs/GOVERNANCE.md](docs/GOVERNANCE.md) | Core architectural invariants and domain rules |
| Deployment & Staging Guide | [docs/deployment.md](docs/deployment.md) | Multi-environment deployment manual |
| Automated Testing Manual | [docs/testing.md](docs/testing.md) | Test suites, coverage requirements and gates |
| Development Workflows | [docs/development.md](docs/development.md) | Branching strategy, PR guidelines, local dev |
| Architecture Reference | [docs/operations/ARCHITECTURE_REFERENCE.md](docs/operations/ARCHITECTURE_REFERENCE.md) | Detailed topology, data flows, and design patterns |
| Environment Guide | [docs/operations/ENVIRONMENT_GUIDE.md](docs/operations/ENVIRONMENT_GUIDE.md) | Configuration variables across environments |
| Migration Guide | [docs/operations/DATABASE_MIGRATIONS.md](docs/operations/DATABASE_MIGRATIONS.md) | Alembic migration management and runbook |
| Backup & Restore | [docs/operations/BACKUP_RESTORE_RUNBOOK.md](docs/operations/BACKUP_RESTORE_RUNBOOK.md) | Disaster recovery and database cloning |
| Release Checklist | [docs/operations/RELEASE_CHECKLIST.md](docs/operations/RELEASE_CHECKLIST.md) | Pre-flight and post-deployment validation steps |
| Troubleshooting | [docs/operations/TROUBLESHOOTING.md](docs/operations/TROUBLESHOOTING.md) | Common errors and remediation steps |
