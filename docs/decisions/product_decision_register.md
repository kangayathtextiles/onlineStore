# Product Decision & Ambiguity Register — KANGAYATH WEB

**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative / Final  
**Scope**: Product, Domain & Operational Behavior  

---

## Overview

This register formally records the analysis, evaluation, and authoritative resolution of the 20 core product ambiguities identified in the original requirements. Every decision here serves as the baseline for all subsequent domain modeling, architecture, and implementation.

---

## 1. Decision Catalog

### DEC-001: Product vs. Variant Availability Semantics
- **Ambiguity**: Is availability tracked at the product level, the variant level, or both?
- **Evidence**: Clothing items exist in distinct sizes (e.g., S, M, L) and colors (e.g., Maroon, Navy). A store rarely runs out of an entire design all at once; specific sizes/colors sell out first.
- **Decision**: Availability is authoritatively tracked at the **Product Variant** level as a boolean state (`is_available: true/false`). Product-level availability is a **derived aggregate property**: a Product is considered *Available* if and only if $\ge 1$ active variant is marked `is_available = true`.
- **Reason**: Reflects physical retail reality accurately and avoids customer disappointment upon visiting the store for an out-of-stock size.
- **Trade-off**: Requires customers to select variants to inspect availability, slightly increasing UI interaction depth.
- **Impact**: All inventory updates target `ProductVariant`. Product queries compute availability via variant aggregation.

---

### DEC-002: Product-Level Sold-Out vs. Variant-Level Sold-Out Override
- **Ambiguity**: Can a shop owner manually force an entire product to "Sold Out" even if individual variants are marked available?
- **Evidence**: Shop owners need emergency overrides (e.g., batch reserved, seasonal stock pulled from floor) without toggling 10 individual variant checkboxes.
- **Decision**: Support a product-level manual override flag: `manual_sold_out: boolean` (Default: `false`).
  $$\text{Effective Availability} = (\neg \text{manual\_sold\_out}) \land (\exists v \in \text{Variants} : v.\text{is\_available} = \text{true})$$
- **Reason**: Provides operational agility for the store owner during peak festival rushes.
- **Trade-off**: Requires clear UI indicators in the Admin panel explaining why a product shows as Sold Out despite available variants.
- **Impact**: Domain model includes `manual_sold_out` on `Product`.

---

### DEC-003: Boolean Availability vs. Numeric Stock Quantity
- **Ambiguity**: Does the MVP require exact numeric stock counts (e.g., "7 items left") or boolean availability status?
- **Evidence**: The store is a local physical retail shop without barcode/POS live API syncing. Maintaining accurate numeric quantities manually in a separate web app during busy counter sales causes rapid inventory drift.
- **Decision**: **Strictly Boolean Availability** (`Available` vs. `Sold Out`). Exact numeric inventory counting is **EXPLICITLY OUT OF SCOPE** for MVP.
- **Reason**: Prevents operational burden on the owner and guarantees high data integrity without POS hardware integration.
- **Trade-off**: Customers cannot see exact remaining units ("Only 2 left!").
- **Impact**: Eliminates complex inventory decrement transactions and race condition handling in the backend.

---

### DEC-004: Product Deletion vs. Archival Strategy
- **Ambiguity**: Should products be hard-deleted or soft-deleted/archived?
- **Evidence**: Customers may have saved product links or bookmarked items. Hard-deleting records instantly breaks referential integrity and customer saved item lists.
- **Decision**: **Soft Archival** (`lifecycle_state: Draft | Published | Hidden | Archived`). Hard deletion (`DELETE FROM products`) is restricted to unreferenced `Draft` items in the admin panel.
- **Reason**: Preserves historical data, prevents broken foreign keys, and allows seamless re-activation for recurring seasonal collections.
- **Trade-off**: Database storage marginally grows over time.
- **Impact**: Public queries filter on `lifecycle_state = 'Published'`.

---

### DEC-005: Category Recursive Hierarchy Depth
- **Ambiguity**: Does "unlimited subcategories" mean arbitrary recursive $N$-level tree depth or a 2-level parent/child taxonomy with unlimited items?
- **Evidence**: Physical clothing stores organize catalogs by Department/Gender (Category $\to$ e.g., Mens, Womens, Kids) and Garment Type (Subcategory $\to$ e.g., Shirts, Sarees, Dhotis). Deeper nesting ($>2$ levels) degrades mobile navigation UX.
- **Decision**: **Strict 2-Level Hierarchy** ($\text{Category} \to \text{Subcategory}$). A Category can have unlimited Subcategories, but Subcategories cannot contain child subcategories.
- **Reason**: Optimal mobile discoverability for local shoppers and eliminates recursive SQL tree traversals.
- **Trade-off**: Cannot support ultra-deep 5-level taxonomic categorizations (which are unnecessary for a local clothing boutique).
- **Impact**: Simple, robust 1-to-many database relationship (`Category` 1:N `Subcategory`).

---

### DEC-006: Customer Saved-Item Persistence Without Authentication
- **Ambiguity**: How do customer saved items persist when user accounts/login are strictly disallowed in MVP?
- **Evidence**: Authentication is barred by client constraint in MVP, but customers expect saved items to survive page refreshes and browser restarts.
- **Decision**: **Dual Persistence Strategy**:
  1. **Primary**: Client-side `localStorage` storing saved Product IDs.
  2. **Secondary/Sync**: Anonymous Server Session Token (UUID stored in HttpOnly cookie / localStorage) syncs to a transient `SavedItemCollection` backend entity.
- **Reason**: Zero login required, 100% resilient across browser reloads, and seamless future migration when Phase 06 authentication is approved.
- **Trade-off**: Saved items do not automatically sync across separate physical devices (e.g., phone to laptop).
- **Impact**: Clean separation of anonymous saved items from authenticated user profiles.

---

### DEC-007: Automatic vs. Manual Shop-Status Precedence
- **Ambiguity**: How is the Shop Open / Closed status calculated?
- **Evidence**: Shops operate on weekly schedules (e.g., 9:30 AM – 9:00 PM, Sunday closed), but unexpectedly close for local hartals, power outages, festival holidays, or family events.
- **Decision**: **Hybrid Model with Authoritative Manual Override**:
  1. Default: Automatically calculated based on current time vs. `OperatingHoursSchedule`.
  2. Override: Owner can toggle `manual_override: AUTO | FORCE_OPEN | FORCE_CLOSED` with an optional banner message (e.g., "Closed today for Onam holiday").
- **Reason**: Fully automated during normal business, fully controllable during exceptions.
- **Trade-off**: Requires scheduled evaluation logic against local timezone.
- **Impact**: Domain entity `StoreStatus` implements the precedence resolver.

---

### DEC-008: Shop-Status Timezone Standardization
- **Ambiguity**: What timezone governs the store operating hours calculation?
- **Evidence**: Kangayath clothing store operates in Kerala/Tamil Nadu (India).
- **Decision**: Hardcoded canonical business timezone: **`Asia/Kolkata` (IST, UTC+05:30)**.
- **Reason**: Eliminates edge cases where a customer browsing from abroad sees incorrect open/closed status calculated in their local browser timezone.
- **Trade-off**: None. The physical store operates exclusively in IST.
- **Impact**: All backend schedule comparisons convert server UTC timestamps to `Asia/Kolkata`.

---

### DEC-009: Filtering Directly by Custom Section
- **Ambiguity**: Can customers filter the main product catalog by Custom Section, or are sections strictly homepage showcase widgets?
- **Evidence**: Customers seeing a promotion banner ("Onam Special Collection") expect to view and filter all items belonging to that promotion on a dedicated page.
- **Decision**: Custom Sections have both **dedicated landing URLs** (`/sections/[slug]`) and act as **top-level filter dimensions** across the product catalog.
- **Reason**: Enhances promotional campaign ROI and allows direct WhatsApp/social media deep-linking.
- **Trade-off**: Requires multi-collection membership indexing.
- **Impact**: `Product` has a many-to-many relationship with `CustomSection`.

---

### DEC-010: Product Ordering Within Custom Sections
- **Ambiguity**: How are products ordered within a custom promotional section?
- **Evidence**: Shop owners curate promotional carousels deliberately (e.g., highest-margin festive saree first).
- **Decision**: **Explicit Manual Sorting Index** (`sort_order: integer`) on the `CustomSectionItem` association, with a fallback to `created_at DESC`.
- **Reason**: Gives the shop owner full merchandising control.
- **Trade-off**: Admin UI must provide an easy reordering interface (drag-and-drop or rank input).
- **Impact**: Section queries sort by `sort_order ASC`.

---

### DEC-011: Multi-Section Product Assignment
- **Ambiguity**: Can a single product belong to multiple custom sections simultaneously?
- **Evidence**: A garment can legitimately be both a "New Arrival" and part of the "Festival Offers" collection.
- **Decision**: **Yes**. Many-to-Many association via `CustomSectionItem`.
- **Reason**: Prevents product duplication and accurately models promotional merchandising.
- **Trade-off**: Deactivating a section must not affect the product's presence in other sections.
- **Impact**: N:M join entity with independent sorting orders.

---

### DEC-012: Category Deletion with Existing Products
- **Ambiguity**: What happens when an admin attempts to delete a category that contains active products?
- **Evidence**: Cascading deletions would accidentally delete dozens of active products and variants.
- **Decision**: **Strict Referential Rejection**. Deleting a category or subcategory containing active products is **BLOCKED** with a descriptive validation error (`CATEGORY_HAS_ACTIVE_PRODUCTS`). The admin must reassign or archive products before deletion.
- **Reason**: Prevents accidental data destruction.
- **Trade-off**: Requires admin to perform a two-step reassignment before purging obsolete categories.
- **Impact**: Domain validation rule enforced in Category repository/service layer.

---

### DEC-013: Searchability of Hidden & Sold-Out Products
- **Ambiguity**: Should Hidden or Sold-Out products appear in customer search results?
- **Evidence**: 
  - *Hidden/Draft/Archived*: The owner specifically chose to conceal these items.
  - *Sold-Out*: Customers searching for a style should see it with a "Sold Out" badge to know the store carries it, unless the owner hides it.
- **Decision**:
  - `Published` + `Available`: Searchable & fully browsable.
  - `Published` + `Sold Out`: Searchable & visible with prominent "Sold Out" badge (unless filtered out by user).
  - `Draft`, `Hidden`, `Archived`: **STRICTLY EXCLUDED** from public search results and catalog queries.
- **Reason**: Balances customer discovery of the store's range while respecting owner privacy on unreleased or pulled designs.
- **Trade-off**: Sold-out products consume search ranking space unless excluded via filter.
- **Impact**: Public search query builder adds `WHERE lifecycle_state = 'Published'`.

---

### DEC-014: Default Customer Visibility for Sold-Out Items
- **Ambiguity**: Are sold-out items shown by default on category pages or hidden behind a filter?
- **Evidence**: A catalog dominated by sold-out badges frustrates visitors, but hiding them entirely makes the shop look empty.
- **Decision**: Sold-out items are **visible by default but sorted below available items** within the same category. A customer-facing filter toggle (`Show Available Only`, Default: `False`) allows users to hide sold-out goods.
- **Reason**: Optimizes browse experience while showcasing the breadth of the shop's physical catalog.
- **Trade-off**: Requires secondary sort key on availability state (`is_available DESC, updated_at DESC`).
- **Impact**: Query ordering specification for category and discovery endpoints.

---

### DEC-015: Product Drafts vs. Immediate Publication
- **Ambiguity**: Can products be created as drafts before going live on the public site?
- **Evidence**: Shop owners take photos and enter details in batches during stock arrival, but only publish when pricing and counter displays are ready.
- **Decision**: Support formal lifecycle states: `Draft` (default on creation), `Published`, `Hidden`, and `Archived`.
- **Reason**: Prevents incomplete listings (e.g., missing photos or variants) from leaking to public shoppers.
- **Trade-off**: Requires an explicit "Publish" action in the admin UI.
- **Impact**: `Product.lifecycle_state` enum column.

---

### DEC-016: Image Count Limits and Primary Image Selection
- **Ambiguity**: How many images can a product have, and how is the thumbnail/cover image determined?
- **Evidence**: Multiple angles (front, back, fabric texture close-up) are vital for clothing discovery, but unlimited image uploads degrade storage and mobile performance.
- **Decision**: Maximum **6 images per product**. Each product must have exactly **1 Primary Image** (`is_primary: boolean`, default: first uploaded image) used for category grids and preview cards.
- **Reason**: Ensures rich visual fidelity while bounding media storage and CDN bandwidth.
- **Trade-off**: Admin is capped at 6 images per product.
- **Impact**: Domain validation rule on `ProductImage` collection ($\le 6$, exactly one `is_primary = true`).

---

### DEC-017: Product Name Uniqueness Scope
- **Ambiguity**: Must product names be globally unique across the entire store?
- **Evidence**: Clothing items frequently share design names across different subcategories (e.g., "Casual Cotton Shirt" in Men's and "Casual Cotton Shirt" in Boys').
- **Decision**: Product names are **NOT globally unique**. However, the **URL Slug must be unique** (`slug` generated as `slugify(name) + '-' + short_id` or scoped uniquely).
- **Reason**: Allows natural retail naming without arbitrary naming hurdles for the owner.
- **Trade-off**: Slugs incorporate collision avoidance identifiers.
- **Impact**: Unique index on `products.slug`.

---

### DEC-018: Size and Color Dictionaries: Free-form vs. Controlled Attributes
- **Ambiguity**: Are sizes and colors free-form text strings or predefined controlled dictionaries?
- **Evidence**: Free-form text creates typos ("Navy Blue", "navy-blue", "Navy", "Navi") that completely break faceted search filters.
- **Decision**: **Controlled Standard Attributes with Custom Expansion**. The system provides standard defaults (Sizes: XS, S, M, L, XL, XXL, Free Size, 28, 30, 32, 34, etc.; Colors: Standard palette with hex codes) and allows the Admin to define custom size/color tokens.
- **Reason**: Guarantees clean, unified filtering on the customer frontend while supporting traditional ethnic sizes (e.g., "Saree Length 6.25m", "Dhoti 4 Mulam").
- **Trade-off**: Requires dedicated configuration entities for `SizeOption` and `ColorOption`.
- **Impact**: Relational foreign keys between variants and attribute options.

---

### DEC-019: Future Requested / Unavailable Products Requirement
- **Ambiguity**: Does the MVP need an automated customer sourcing/enquiry system for unstocked items?
- **Evidence**: The physical shop owner welcomes customer inquiries, but building a custom ticketing/sourcing workflow inside the MVP is premature and adds heavy complexity.
- **Decision**: Handled via **Direct WhatsApp Pre-filled Inquiries** (`"Hi Kangayath, I am looking for [Product Name/Type]..."`). No dedicated enquiry backend database tables in MVP.
- **Reason**: Leverages the customer's familiar communication tool (WhatsApp) with zero backend maintenance.
- **Trade-off**: Inquiries are not tracked in an admin dashboard table in MVP.
- **Impact**: Out-of-scope for backend database in MVP; handled via frontend CTA link generation.

---

### DEC-020: Admin Content Publication Workflow
- **Ambiguity**: Do admin changes require multi-step approvals or staging previews before going live?
- **Evidence**: Kangayath is a single-owner / small-team physical boutique. Multi-stage approval workflows (Author $\to$ Reviewer $\to$ Publisher) add unnecessary friction.
- **Decision**: **Direct Publishing Model**. Changes published by the Admin take effect immediately in PostgreSQL.
- **Reason**: High velocity and operational simplicity for the shop owner.
- **Trade-off**: No built-in audit trail for draft editorial revisions prior to publishing.
- **Impact**: Immediate transaction commit to the authoritative database.

---

## 2. Decision Summary Matrix

| Decision ID | Domain Area | Authoritative Resolution | Phase 03 Impact |
| :--- | :--- | :--- | :--- |
| **DEC-001** | Variants | Boolean availability per variant; product is derived aggregate | `ProductVariant.is_available: bool` |
| **DEC-002** | Sold-Out | Product-level `manual_sold_out` override flag | `Product.manual_sold_out: bool` |
| **DEC-003** | Inventory | Strict Boolean availability; numeric stock counts OUT OF SCOPE | No inventory counts in DB |
| **DEC-004** | Lifecycle | Soft archival (`Draft`, `Published`, `Hidden`, `Archived`) | `Product.lifecycle_state: enum` |
| **DEC-005** | Categories | Strict 2-level taxonomy ($\text{Category} \to \text{Subcategory}$) | 1:N relational foreign keys |
| **DEC-006** | Saved Items | `localStorage` + anonymous session sync | Anonymous cookie / token sync |
| **DEC-007** | Shop Status | Schedule calculation + authoritative manual override | `StoreStatus` precedence logic |
| **DEC-008** | Timezone | Canonical `Asia/Kolkata` (IST, UTC+05:30) | Timezone normalization in core |
| **DEC-009** | Sections | Custom sections serve as landing pages & catalog filters | N:M join table & query filter |
| **DEC-010** | Sections | Explicit manual sorting index per section item | `CustomSectionItem.sort_order` |
| **DEC-011** | Sections | Multi-section product assignment permitted | N:M relationship model |
| **DEC-020** | Publishing | Direct publishing model without multi-tier approval | Immediate database commit |
