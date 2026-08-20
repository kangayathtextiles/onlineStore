# Requirements Traceability Matrix (RTM) — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative Reference  

---

## 1. Traceability Matrix

| Req ID | Requirement Summary | Domain Aggregate | User Story | Business Rule | Acceptance Criteria | Workflow | Priority | Phase Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Store profile & contact info | StoreProfile | US-ADM-007 | BR-001 | AC-001 | Workflow R | P0 | Phase 04 / 07 |
| **FR-002** | Weekly operating schedule | OperatingHoursSchedule | US-ADM-007 | BR-002 | AC-002 | Workflow O | P0 | Phase 04 / 07 |
| **FR-003** | Real-time open/closed calculation | StoreStatus | US-CUS-005 | BR-003 | AC-003 | Workflow P | P0 | Phase 05 / 07 |
| **FR-004** | Manual open/closed override | StoreStatus | US-ADM-007 | BR-004 | AC-004 | Workflow O | P0 | Phase 05 / 07 |
| **FR-005** | Public shop info & status display | StoreProfile | US-CUS-005 | BR-005 | AC-005 | Workflow P | P0 | Phase 08 / 09 |
| **FR-006** | WhatsApp deep-link generation | StoreProfile | US-CUS-006 | BR-006 | AC-006 | Workflow Q | P0 | Phase 08 / 09 |
| **FR-007** | Category management | Category | US-ADM-001 | BR-007 | AC-007 | Workflow A | P0 | Phase 04 / 07 |
| **FR-008** | Subcategory management | Subcategory | US-ADM-001 | BR-008 | AC-008 | Workflow B | P0 | Phase 04 / 07 |
| **FR-009** | 2-level taxonomy enforcement | Catalog | US-ADM-001 | BR-009 | AC-009 | Workflow B | P0 | Phase 04 / 05 |
| **FR-010** | Category deletion guard | Category | US-ADM-001 | BR-010 | AC-010 | Workflow A | P0 | Phase 04 / 05 |
| **FR-011** | Customer category navigation | Category | US-CUS-001 | BR-011 | AC-011 | Workflow K | P0 | Phase 08 / 09 |
| **FR-012** | Product creation & editing | Product | US-ADM-002 | BR-012 | AC-012 | Workflow C | P0 | Phase 04 / 07 |
| **FR-013** | Product lifecycle states | Product | US-ADM-002 | BR-013 | AC-013 | Workflow G | P0 | Phase 04 / 05 |
| **FR-014** | Multi-image & primary image | ProductImage | US-ADM-003 | BR-014 | AC-014 | Workflow C | P0 | Phase 04 / 07 |
| **FR-015** | Product publishing invariants | Product | US-ADM-002 | BR-015 | AC-015 | Workflow C | P0 | Phase 05 / 07 |
| **FR-016** | Controlled size/color options | Size/ColorOption | US-ADM-004 | BR-016 | AC-016 | Workflow C | P0 | Phase 04 / 07 |
| **FR-017** | Product variant matrix | ProductVariant | US-ADM-004 | BR-017 | AC-017 | Workflow C | P0 | Phase 04 / 07 |
| **FR-018** | Variant uniqueness per product | ProductVariant | US-ADM-004 | BR-018 | AC-018 | Workflow C | P0 | Phase 04 / 05 |
| **FR-019** | Variant availability toggle | ProductVariant | US-ADM-004 | BR-019 | AC-019 | Workflow D | P0 | Phase 05 / 07 |
| **FR-020** | Product-level sold-out override | Product | US-ADM-005 | BR-020 | AC-020 | Workflow E | P0 | Phase 05 / 07 |
| **FR-021** | Derived aggregate availability | ProductVariant | US-CUS-002 | BR-021 | AC-021 | Workflow D | P0 | Phase 05 / 07 |
| **FR-022** | Customer variant inspection | ProductVariant | US-CUS-002 | BR-022 | AC-022 | Workflow L | P0 | Phase 08 / 09 |
| **FR-023** | Custom section management | CustomSection | US-ADM-006 | BR-023 | AC-023 | Workflow H | P0 | Phase 04 / 07 |
| **FR-024** | Section item curation & sorting | CustomSectionItem | US-ADM-006 | BR-024 | AC-024 | Workflow I | P0 | Phase 04 / 07 |
| **FR-025** | Multi-section product assignment | CustomSectionItem | US-ADM-006 | BR-025 | AC-025 | Workflow I | P0 | Phase 04 / 07 |
| **FR-026** | Section carousels & landing pages | CustomSection | US-CUS-001 | BR-026 | AC-026 | Workflow K | P0 | Phase 08 / 09 |
| **FR-027** | Keyword search across catalog | Product | US-CUS-003 | BR-027 | AC-027 | Workflow K | P0 | Phase 05 / 07 |
| **FR-028** | Faceted filtering (Size, Color) | ProductVariant | US-CUS-003 | BR-028 | AC-028 | Workflow L | P0 | Phase 05 / 07 |
| **FR-029** | Sold-out items display & sorting | Product | US-CUS-001 | BR-029 | AC-029 | Workflow K | P0 | Phase 05 / 08 |
| **FR-030** | "Show Available Only" toggle | Product | US-CUS-003 | BR-030 | AC-030 | Workflow L | P0 | Phase 08 / 09 |
| **FR-031** | Sorting & pagination | Product | US-CUS-001 | BR-031 | AC-031 | Workflow K | P0 | Phase 05 / 07 |
| **FR-032** | Save / remove favorite products | SavedItemCollection | US-CUS-004 | BR-032 | AC-032 | Workflow M | P0 | Phase 08 / 09 |
| **FR-033** | Unauthenticated saved items | SavedItemCollection | US-CUS-004 | BR-033 | AC-033 | Workflow N | P0 | Phase 05 / 08 |
| **FR-034** | Saved items availability badges | SavedItem | US-CUS-004 | BR-034 | AC-034 | Workflow N | P0 | Phase 08 / 09 |
| **FR-035** | WhatsApp inquiry from saved items | StoreProfile | US-CUS-006 | BR-035 | AC-035 | Workflow Q | P0 | Phase 08 / 09 |
| **NFR-001** | Sub-2s mobile LCP performance | Performance | N/A | N/A | AC-NFR-01 | All | P0 | Phase 08 / 11 |
| **NFR-007** | Brand palette compliance | UX & Styling | N/A | N/A | AC-NFR-07 | All | P0 | Phase 08 / 09 |
| **NFR-010** | Local SEO JSON-LD & Open Graph | SEO | US-SYS-001 | N/A | AC-SYS-01 | All Public | P0 | Phase 08 / 09 |
| **NFR-013** | PostgreSQL single source of truth | Data Layer | N/A | N/A | AC-NFR-13 | All | P0 | Phase 03 / 04 |
