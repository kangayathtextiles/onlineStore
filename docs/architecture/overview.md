# Architectural Overview — KANGAYATH WEB

**Phase**: Phase 03 Transition $\to$ Phase 04  
**Status**: Authoritative Reference  

---

## 1. System Context Diagram

```text
                                  ┌───────────────────────────────┐
                                  │      Customer Mobile / Web    │
                                  │   Next.js (App Router / SSR)  │
                                  │   (Public Browsing & Saved)   │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / JSON
                                                  ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│     Admin / Owner Portal      │         │      Unified FastAPI Core     │
│   Next.js (App Router / CSR)  ├────────►│   (/api/v1/public & /admin)   │
│   (Catalog & Status Control)  │ HTTP    └───────────────┬───────────────┘
└───────────────────────────────┘                         │ Asyncpg (SQLAlchemy 2.0)
                                                          ▼
                                          ┌───────────────────────────────┐
                                          │      PostgreSQL 16 Database   │
                                          │   (Authoritative Data Store)  │
                                          └───────────────────────────────┘
```

---

## 2. Master Architecture Specification

- **Master Technical Architecture**: [docs/architecture/technical_architecture.md](technical_architecture.md)

---

## 3. Architecture Decision Records (ADRs)

- [ADR-0001: Monorepo Organization](../decisions/ADR-0001-monorepo-structure.md)
- [ADR-0002: Backend FastAPI Stack](../decisions/ADR-0002-backend-fastapi-stack.md)
- [ADR-0003: Frontend Next.js Stack](../decisions/ADR-0003-frontend-nextjs-stack.md)
- [ADR-0004: Configuration Governance & Secrets](../decisions/ADR-0004-configuration-and-secrets.md)
- [ADR-0005: Multi-Tiered Testing Strategy](../decisions/ADR-0005-testing-strategy.md)
- [ADR-0006: Modular Monolith Backend](../decisions/ADR-0006-modular-monolith-backend.md)
- [ADR-0007: Public vs Admin API Separation](../decisions/ADR-0007-public-vs-admin-api-separation.md)
- [ADR-0008: Variation-Based Inventory Model](../decisions/ADR-0008-variation-based-inventory-model.md)
- [ADR-0009: Generic Dynamic Custom Section Model](../decisions/ADR-0009-generic-custom-collection-model.md)
- [ADR-0010: Deferred Authentication Boundary](../decisions/ADR-0010-deferred-authentication-boundary.md)
- [ADR-0011: Customer SSR/ISR Rendering Strategy](../decisions/ADR-0011-customer-ssr-isr-rendering-strategy.md)
- [ADR-0012: Media Storage and Optimization Pipeline](../decisions/ADR-0012-media-storage-and-optimization-pipeline.md)
