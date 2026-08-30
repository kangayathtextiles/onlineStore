# Automated Testing Manual & Quality Gates

## 1. Multi-Tier Test Pyramid

KANGAYATH WEB enforces a multi-tier testing strategy across both backend and frontend:

```text
               ▲
              / \     Smoke & Regression Verification (scripts/smoke-test.sh)
             /   \    PostgreSQL live integration tests (pytest with PostgreSQL container)
            /     \   FastAPI integration tests (httpx AsyncClient, dependency overrides)
           /       \  Frontend Component & Workspace tests (Vitest, React Testing Library)
          /─────────\ Static Analysis & Type Checking (Ruff, ESLint, Mypy, TypeScript)
```

---

## 2. Running Tests Locally

### Quick Full-Stack Test (Windows PowerShell)
```powershell
.\scripts\test.ps1
```

### Backend Tests (`apps/api`)
```bash
cd apps/api

# Run linter & formatter checks
ruff check .
ruff format --check .

# Run static type checking
mypy app

# Run full pytest suite with coverage
pytest -v --cov=app --cov-report=term-missing
```

### Frontend Tests (`apps/web`)
```bash
cd apps/web

# Run ESLint
npm run lint

# Run TypeScript typecheck
npm run typecheck

# Run Vitest suite
npm run test

# Run Next.js production build verification
npm run build
```

---

## 3. Test Database Strategy

1. **Unit & Fast Integration Tests**:
   - Uses `sqlite+aiosqlite:///:memory:` configured in `apps/api/tests/conftest.py` with PRAGMA foreign keys enabled.
   - Tables are dynamically created and torn down per test in-memory.
   - Requires zero external dependencies and runs in milliseconds.

2. **Live PostgreSQL Integration Tests**:
   - Configured in `apps/api/tests/test_database_connection.py` and GitHub Actions CI.
   - Spins up an isolated PostgreSQL 16 container (`image: postgres:16-alpine`).
   - Validates live async connection pooling, schema migrations, seeds, and error handling without password leakage.

---

## 4. Key Business Logic Regression Suites

| Suite | File | Focus Areas |
|---|---|---|
| **Price Protection** | `test_price_protection.py` & `price-protection.test.tsx` | Guarantees public customer endpoints and pages NEVER expose garment prices. |
| **QR Code & Lifecycle** | `test_qr_lifecycle_management.py` & `qr.test.tsx` | Validates unique QR code generation, stable Style Code formatting, 3 lifecycle actions (SOLD OUT, DAMAGED, RETURN), and 2-year retention cleanup. |
| **Store Status** | `test_services.py` & `shop.test.tsx` | Validates automatic schedule computation, manual override flags, and banner updates. |
| **Categories & Sections** | `test_api_public.py` & `catalog.test.tsx` | Validates category hierarchy, filter queries, and dynamic homepage sections. |
| **Zero Price Guarantee** | `scripts/smoke-test.sh` | Post-deployment grep verification ensuring no `"price"` keys in public API responses. |
