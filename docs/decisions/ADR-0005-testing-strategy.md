# ADR-0005: Multi-Tiered Testing Strategy

## Status
Accepted

## Context
A mission-critical enterprise application requires multi-tiered automated verification to prevent regressions, validate contracts, and ensure high test velocity without flakiness.

## Decision
We implement a 3-tier testing pyramid:
1. **Unit & Property Testing**:
   - Backend: `pytest` with `pytest-asyncio` testing models, schemas, and service functions in isolation.
   - Frontend: `vitest` + `@testing-library/react` testing component rendering, state changes, and utility functions.
2. **Integration / Contract Testing**:
   - Backend: `httpx.AsyncClient` invoking FastAPI router endpoints verifying status codes, OpenAPI serialization, and middleware.
   - Frontend: Mock Service Worker / HTTP mocking verifying client resilience.
3. **End-to-End (E2E) & Smoke Testing**:
   - Container healthchecks verifying live HTTP availability (`/health` and `/api/v1/health`).
   - Playwright E2E foundation for critical user journeys (introduced in subsequent phases).

## Consequences
- **Positive**: Rapid local test feedback, automated continuous integration gates, predictable deployment safety.
- **Negative**: Test suites must be maintained alongside schema and API changes.
