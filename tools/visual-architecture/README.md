# KANGAYATH WEB — Official Archify Codebase Architecture Map

This directory contains the **official, verified Archify architecture diagram** for the KANGAYATH WEB repository, compiled via the `tt-a1i/archify` skill engine.

---

## Verification Summary

All Archify showcase quality gates passed with **0 errors**:

| Gate | Status | Details |
|---|---|---|
| **Validate** | `PASS` | Candidate specification matches `architecture.schema.json` |
| **Deliver** | `PASS` | Compiled into self-contained HTML (`780 KB`) |
| **Check** | `PASS` | Deterministic SHA256 artifact integrity verified |
| **Browser-Check** | `PASS` | Real browser headless rendering test passed with zero errors |

- **Source Snapshot**: commit `47123d2a1c3350d1c29945dd754662a0bcc021f5`
- **Output Artifact**: [`index.html`](index.html)

---

## How to View

Open `index.html` in your browser:

- **Windows**: Double-click `index.html` or run:
  ```powershell
  Start-Process "tools\visual-architecture\index.html"
  ```
- **macOS / Linux**:
  ```bash
  open tools/visual-architecture/index.html
  ```

---

## Architecture Mappings & Evidence

Every component links to authentic, committed source files:

1. **Shoppers & Staff**: `apps/web/app/(customer)/page.tsx`
2. **WhatsApp Web**: `apps/web/app/(customer)/products/[slug]/page.tsx` (Line 577 `wa.me` CTA)
3. **Edge Proxy**: `render.yaml` (TLS 1.3 / HTTP/2 reverse proxy)
4. **Customer Showroom**: `apps/web/app/(customer)/products/page.tsx` (Next.js 15 SSR)
5. **Admin Console**: `apps/web/app/admin/products/page.tsx` (CSR Management & ZXing QR scanner)
6. **Edge Cookie Guard**: `apps/web/middleware.ts` (HttpOnly `admin_session` cookie verification)
7. **FastAPI Monolith**: `apps/api/app/main.py` (ASGI engine :8000)
8. **Session Auth**: `apps/api/app/core/security.py` (HMAC-SHA256 constant-time verification)
9. **Domain Services**: `apps/api/app/services/product_service.py` (3-tier price display & IST engine)
10. **Storage Service**: `apps/api/app/services/storage_service.py` (S3 multipart upload)
11. **Async Repositories**: `apps/api/app/repositories/product_repository.py` (SQLAlchemy 2.0 `selectinload`)
12. **PostgreSQL 16**: `apps/api/app/models/base.py` (10 relational tables)
13. **Supabase Storage**: `apps/api/app/core/config.py` (Product photography CDN)

---

## Zero Impact Guarantee

- **No Project Code Modified**: `apps/web/`, `apps/api/`, `infrastructure/`, `render.yaml`, `scripts/test.ps1`, and CI workflows remain 100% clean and untouched.
- **Standalone Artifact**: `index.html` has zero external runtime requirements.
