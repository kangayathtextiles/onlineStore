# Automated Testing Strategy

## Overview

KANGAYATH WEB enforces a multi-tier test pyramid:

```text
       ▲
      / \     E2E / Smoke Tests (Health probes & Playwright)
     /   \
    /     \    Integration Tests (FastAPI AsyncClient, HTTP endpoints)
   /       \
  /─────────\   Unit & Schema Tests (Pytest, Vitest)
```

## Running Tests

### Full Monorepo Test
```powershell
.\scripts\test.ps1
```

### Backend Test Execution
```bash
cd apps/api
pytest -v --cov=app --cov-report=term-missing
```

### Frontend Test Execution
```bash
cd apps/web
npm run test
```

## Coverage Requirements
- New services, repositories, and critical utility logic require minimum **80% code coverage**.
- All PRs must maintain or improve overall test coverage.
