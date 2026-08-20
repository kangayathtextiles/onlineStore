# Architectural Overview — KANGAYATH WEB

**Phase**: Phase 02 Transition $\to$ Phase 03  
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

## 2. Bounded Contexts Summary

1. **Store Operations Context**: Profile, Operating Hours, Real-time Open/Closed status in `Asia/Kolkata` with emergency override.
2. **Catalog & Taxonomy Context**: 2-level hierarchical navigation (`Category` $\to$ `Subcategory`).
3. **Product & Inventory Context**: Garment details, image gallery ($\le 6$), Size/Color variant matrix, boolean availability, manual sold-out override, and lifecycle states (`Draft`, `Published`, `Hidden`, `Archived`).
4. **Merchandising Context**: Promotional custom sections (e.g. Onam Special), manual item ordering.
5. **Customer Discovery Context**: Anonymous Saved Items (`localStorage` + session sync), faceted search, and WhatsApp inquiry generation.

---

## 3. Authoritative Documentation Index

- **Product Requirements Document (PRD)**: [docs/requirements/PRD.md](../requirements/PRD.md)
- **Domain Specification**: [docs/domain/domain_specification.md](../domain/domain_specification.md)
- **User Stories & Acceptance Criteria**: [docs/requirements/user_stories.md](../requirements/user_stories.md)
- **Critical Workflows (A through R)**: [docs/requirements/workflows.md](../requirements/workflows.md)
- **Requirements Traceability Matrix**: [docs/requirements/traceability_matrix.md](../requirements/traceability_matrix.md)
- **Product Decision Register**: [docs/decisions/product_decision_register.md](../decisions/product_decision_register.md)
- **MVP Scope Matrix**: [docs/requirements/mvp_scope_matrix.md](../requirements/mvp_scope_matrix.md)
- **Phase 03 Handover Specification**: [docs/requirements/phase03_input_spec.md](../requirements/phase03_input_spec.md)
