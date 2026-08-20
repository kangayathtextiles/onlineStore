# Architectural Overview — KANGAYATH WEB

## System Context Diagram

```text
               ┌───────────────────────────────┐
               │         Web Client            │
               │   Next.js 15+ App Router      │
               │   (Port 3000 / apps/web)      │
               └───────────────┬───────────────┘
                               │ HTTP / JSON
                               ▼
               ┌───────────────────────────────┐
               │         Backend API           │
               │   FastAPI + Pydantic v2       │
               │   (Port 8000 / apps/api)      │
               └───────────────┬───────────────┘
                               │ Async SQL (SQLAlchemy 2.0)
                               ▼
               ┌───────────────────────────────┐
               │      PostgreSQL 16 DB         │
               │   (Port 5432 / Docker DB)     │
               └───────────────────────────────┘
```

## Architectural Goals
1. **Maintainability**: Low coupling, high cohesion across features.
2. **Scalability**: Stateless FastAPI application containers capable of horizontal scaling behind a reverse proxy/load balancer.
3. **Observability**: Structured logging, health probe contracts (`/health` and `/api/v1/health`), and metrics readiness.
4. **Developer Experience**: One-command local startup via `docker-compose.yml`, fast feedback loops via Ruff and Vitest.
