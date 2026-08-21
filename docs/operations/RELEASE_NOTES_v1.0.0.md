# Release Notes — KANGAYATH WEB v1.0.0-rc1

**Release Date**: August 21, 2026  
**Status**: Production Release Candidate 1  
**Target Platform**: Digital Showroom & Local Product Discovery for Physical Retail Clothing Store (Kerala, India)

---

## 1. Executive Summary

KANGAYATH WEB v1.0.0-rc1 is the official production-ready release candidate of the digital showroom platform for Kangayath Clothing Store. The platform enables nearby customers to discover authentic Kerala handlooms, wedding silks, festive sarees, and daily wear available in the physical retail showroom, check real-time store operating hours (IST), inspect size/color availability, save items for physical store visits, and initiate direct WhatsApp inquiries.

---

## 2. Core Business Invariants & Constraints Enforced

1. **Zero Price Exposure Guarantee**: Strictly NO price, cost, amount, MRP, or monetary fields are displayed anywhere on the customer frontend, public APIs, Open Graph metadata, or JSON-LD structured data.
2. **Physical Store Discovery Model**: Strictly NO e-commerce carts, online payments, checkout, home delivery, or order management. Customers discover products online and purchase them physically at the shop.
3. **Controlled Admin Authentication**: In strict compliance with client governance, administrative authentication is unconfigured pending explicit client approval. Admin endpoints are prepared for reverse-proxy / VPN boundary control.
4. **Brand Design System**: Curated color tokens:
   - Canvas: `#F0EFED`
   - Heritage Maroon: `#2A0D0B`
   - Wine Accent: `#651714`
   - Dark Plum: `#3C2227`
   - Charcoal Olive: `#333323`

---

## 3. Verified Capabilities & Features

### A. Admin Control Center (`/admin`)
- **Real-Time Store Operations**: View and update store contact info, address, weekly schedules, and emergency overrides (`AUTO`, `FORCE_OPEN`, `FORCE_CLOSED`) with custom banner announcements.
- **Taxonomy & Category Tree**: Create, edit, reorder, and delete main categories and subcategories with thumbnail previews and cascade deletion guards.
- **Garment Product Management**: Full product lifecycle management (`DRAFT`, `PUBLISHED`, `HIDDEN`, `ARCHIVED`), multi-image uploads (up to 6 images) with drag-and-drop reordering and primary flag assignment.
- **Combinatorial Variant Matrix**: Generate all size $\times$ color permutations with independent stock availability toggles.
- **Manual Sold-Out Override**: Mark products sold-out at the product level while preserving backend records.
- **Promotional Custom Sections**: Curate arbitrary collections (e.g., *Onam Festival Specials*, *New Arrivals*, *Wedding Edit*), reorder items, and toggle active/inactive status.

### B. Customer Digital Showroom (`/`)
- **Visual Catalog Discovery**: Dynamic faceted filtering by category, subcategory, size, color, and in-stock status with debounced keyword search.
- **Garment Detail Workspace**: Multi-image thumbnail gallery, size & color selector pills, live stock availability indicator, and WhatsApp trial inquiry deep links.
- **Local Store Hours & Status**: Live IST open/closed status pill, weekly operating hours timetable, physical store address, and Google Maps navigation links.
- **Anonymous Wishlist**: Local storage saved items with real-time stock availability synchronization without requiring user login.
- **Local SEO & Microdata**: Server-rendered dynamic `robots.txt`, `sitemap.xml`, and schema.org `ClothingStore`, `Product`, and `BreadcrumbList` JSON-LD microdata.

---

## 4. Test Verification Summary

- **Total Backend Automated Tests**: 31/31 passed (100% pass rate)
  - Unit & Service Tests: 6 test suites
  - End-to-End Acceptance: 26-step sequential loop ([test_e2e_acceptance.py](file:///c:/Users/akr26/OneDrive/Documents/kangayath%20Web/apps/api/tests/test_e2e_acceptance.py))
  - Database Lifecycle: 18 scenarios ([test_database_lifecycle.py](file:///c:/Users/akr26/OneDrive/Documents/kangayath%20Web/apps/api/tests/test_database_lifecycle.py))
  - System Resilience & Hardening: 6 scenarios ([test_phase09_resilience.py](file:///c:/Users/akr26/OneDrive/Documents/kangayath%20Web/apps/api/tests/test_phase09_resilience.py))
  - Release Candidate System Loop: 12 steps ([test_phase10_release_candidate.py](file:///c:/Users/akr26/OneDrive/Documents/kangayath%20Web/apps/api/tests/test_phase10_release_candidate.py))
- **Total Frontend Automated Tests**: 14 test files, 20 tests passed (100% pass rate)
- **Static Typing & Linting**: 0 errors across 60 Python source files (Mypy) and Next.js TypeScript (tsc).
- **Production Build**: 16 static and dynamic routes compiled cleanly via `next build`.
