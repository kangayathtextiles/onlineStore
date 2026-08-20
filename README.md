# KANGAYATH WEB

Enterprise web platform with high-performance FastAPI backend, Next.js frontend, and comprehensive engineering governance.

---

## 🏛️ Project Governance & Architecture

The project adheres to strict governance principles established in **Phase 01**:

- **Engineering Constitution**: [docs/GOVERNANCE.md](docs/GOVERNANCE.md)
- **Architectural Overview**: [docs/architecture/overview.md](docs/architecture/overview.md)
- **Architecture Decision Records**: [docs/decisions/](docs/decisions/)
  - [ADR-0001: Monorepo Organization](docs/decisions/ADR-0001-monorepo-structure.md)
  - [ADR-0002: Backend FastAPI Stack](docs/decisions/ADR-0002-backend-fastapi-stack.md)
  - [ADR-0003: Frontend Next.js Stack](docs/decisions/ADR-0003-frontend-nextjs-stack.md)
  - [ADR-0004: Configuration & Secrets](docs/decisions/ADR-0004-configuration-and-secrets.md)
  - [ADR-0005: Testing Strategy](docs/decisions/ADR-0005-testing-strategy.md)
- **Security Baseline**: [docs/security/baseline.md](docs/security/baseline.md)
- **Testing Strategy**: [docs/testing/strategy.md](docs/testing/strategy.md)

---

## 📂 Repository Structure

```text
kangayath-web/
├── apps/
│   ├── api/            # Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0
│   └── web/            # Next.js 15+ App Router, TypeScript, React 19, TailwindCSS
├── packages/           # Shared libraries, types, and utilities
├── infrastructure/     # Dockerfiles, docker-compose, and DB init scripts
├── docs/               # Architecture records, runbooks, and governance guides
├── scripts/            # Cross-platform development and test scripts
└── .github/workflows/  # CI/CD automation pipelines
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Git**
- **Python 3.12+**
- **Node.js 20+**
- **Docker & Docker Compose**

### 2. Environment Setup
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Launch via Docker Compose
```bash
docker-compose up
```
Endpoints:
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Running Automated Tests
```powershell
.\scripts\test.ps1
```

---

## 📋 Development Roadmap

- [x] **Phase 01: Foundation & Project Governance** *(Current)*
- [ ] Phase 02: Product Requirements & Domain Specification
- [ ] Phase 03: Technical Architecture
- [ ] Phase 04: Database & Data Layer
- [ ] Phase 05: Backend Core
- [ ] Phase 06: Authentication & Authorization
- [ ] Phase 07: Core Business APIs
- [ ] Phase 08: Frontend Architecture & UI System
- [ ] Phase 09: Frontend Feature Implementation
- [ ] Phase 10: Admin, Operations & Platform Features
- [ ] Phase 11: Testing, Security & Performance
- [ ] Phase 12: Deployment, Observability & Production Launch
