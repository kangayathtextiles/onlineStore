# Phase 03 Input Specification (Handover Spec) — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase Handover**: From Phase 02 (Requirements) $\to$ To Phase 03 (Technical Architecture)  
**Status**: Authoritative Reference  

---

## 1. Architectural Handover Overview

This document specifies the exact domain models, aggregates, invariants, and capability contracts that **Phase 03 (Technical Architecture)** and subsequent implementation phases must translate into software architecture, database schemas, and API contracts.

---

## 2. Bounded Contexts & Aggregate Roots

```text
1. Store Operations Context
   ├── Aggregate Root: StoreProfile
   ├── Entities: OperatingHoursSchedule, StoreStatus
   └── Core Responsibilities: Business metadata, operating hours, real-time status calculation (Asia/Kolkata), manual overrides.

2. Catalog & Taxonomy Context
   ├── Aggregate Root: Category
   ├── Entities: Subcategory
   └── Core Responsibilities: 2-level hierarchical navigation, slug management, category containment invariants.

3. Product & Inventory Context
   ├── Aggregate Root: Product
   ├── Entities: ProductImage, ProductVariant, SizeOption, ColorOption
   └── Core Responsibilities: Garment modeling, image gallery (max 6), variant matrix, boolean availability, manual sold-out override, lifecycle state machine (Draft, Published, Hidden, Archived).

4. Merchandising Context
   ├── Aggregate Root: CustomSection
   ├── Entities: CustomSectionItem (Join Entity)
   └── Core Responsibilities: Dynamic promotional showcases (e.g. Onam Offers), manual sorting order, multi-section product associations.

5. Customer Engagement Context
   ├── Aggregate Root: SavedItemCollection
   ├── Entities: SavedItem
   └── Core Responsibilities: Anonymous session-based favorites persistence, live availability badge synchronization.
```

---

## 3. Required Database Schemas for Phase 04 (Data Layer)

Phase 03 must design the PostgreSQL schema with the following relational tables, constraints, and indexes:

1. **`stores`**: Singleton table holding shop name, address, contact, WhatsApp, and GPS coordinates.
2. **`operating_schedules`**: 7 rows (Monday–Sunday) with `store_id`, `day_of_week`, `is_closed`, `open_time`, `close_time`.
3. **`store_statuses`**: Singleton record holding `override_mode`, `override_banner`, `override_until`.
4. **`categories`**: `id`, `name`, `slug` (Unique), `description`, `thumbnail_url`, `display_order`, `is_active`.
5. **`subcategories`**: `id`, `category_id` (FK RESTRICT), `name`, `slug` (Unique), `display_order`, `is_active`. Unique constraint on `(category_id, name)`.
6. **`size_options`**: `id`, `name` (e.g. "M", "38"), `display_order`.
7. **`color_options`**: `id`, `name` (e.g. "Maroon"), `hex_code` (`#651714`), `display_order`.
8. **`products`**: `id`, `category_id` (FK), `subcategory_id` (FK), `name`, `slug` (Unique), `description`, `material`, `style_code`, `lifecycle_state`, `manual_sold_out`, `featured`, `meta_title`, `meta_description`, `created_at`, `updated_at`.
9. **`product_images`**: `id`, `product_id` (FK CASCADE), `url`, `alt_text`, `is_primary` (Boolean), `display_order`. Constraint: $\le 6$ images per product.
10. **`product_variants`**: `id`, `product_id` (FK CASCADE), `size_id` (FK), `color_id` (FK), `sku`, `is_available` (Boolean). Unique constraint on `(product_id, size_id, color_id)`.
11. **`custom_sections`**: `id`, `title`, `slug` (Unique), `subtitle`, `banner_image_url`, `is_active`, `display_order`.
12. **`custom_section_items`**: `id`, `section_id` (FK CASCADE), `product_id` (FK CASCADE), `sort_order`. Unique on `(section_id, product_id)`.
13. **`saved_item_collections`**: `id`, `session_token` (Unique Index), `created_at`, `updated_at`.
14. **`saved_items`**: `id`, `collection_id` (FK CASCADE), `product_id` (FK CASCADE), `saved_at`. Unique on `(collection_id, product_id)`.

---

## 4. API Capability Contracts for Phase 05 & 07 (Backend)

Phase 03 must design the FastAPI REST routing structure into two namespaces:

### 4.1 Public Customer API (`/api/v1/public/`)
- `GET /store/info`: Returns store profile, current calculated open/closed status, and operating hours.
- `GET /categories`: Returns active categories and subcategories.
- `GET /sections`: Returns active promotional sections with featured products.
- `GET /sections/{slug}`: Returns a specific section and its paginated product list.
- `GET /products`: Paginated catalog with keyword search and filters (`category`, `subcategory`, `size`, `color`, `section`, `available_only`).
- `GET /products/{slug}`: Product details with full image gallery, variant availability matrix, and related items.
- `GET /saved-items`: Retrieve live details for a list of saved product IDs / session token.
- `POST /saved-items/sync`: Sync anonymous client-side saved items with session collection.

### 4.2 Admin Management API (`/api/v1/admin/`)
- `GET / PUT /admin/store/info`: Manage store profile and contacts.
- `GET / PUT /admin/store/schedule`: Manage weekly operating hours.
- `POST /admin/store/override`: Set manual open/closed override.
- `CRUD /admin/categories` & `CRUD /admin/subcategories`: Taxonomy management.
- `CRUD /admin/products`: Product authoring, lifecycle state transitions, image upload/reorder.
- `CRUD /admin/products/{id}/variants`: Variant matrix generation and availability toggles.
- `PUT /admin/products/{id}/sold-out`: Toggle product-level sold-out override.
- `CRUD /admin/sections` & `PUT /admin/sections/{id}/items`: Custom promotional section curation.
- `CRUD /admin/attributes/sizes` & `CRUD /admin/attributes/colors`: Controlled dictionary management.

---

## 5. Non-Functional & Architecture Requirements

1. **FastAPI Layering**: Enforce strict separation: `Router (API)` $\to$ `Service (Business Rules & Invariants)` $\to$ `Repository (SQLAlchemy 2.0 Async)` $\to$ `PostgreSQL`.
2. **Next.js Rendering Strategy**:
   - Customer Frontend: Server-Side Rendering (SSR) / Incremental Static Regeneration (ISR) for high SEO ranking, instant mobile LCP, and social share previews.
   - Admin Frontend: Client-Side Interactive Dashboard (CSR) for rapid state management and immediate feedback.
3. **Timezone Handling**: Canonical evaluation of schedules in `Asia/Kolkata` using Python standard `zoneinfo.ZoneInfo("Asia/Kolkata")`.
