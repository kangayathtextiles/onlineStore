# Product Requirements Document (PRD) — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative / Approved Baseline  

---

## 1. Executive Summary & Vision

### 1.1 Product Purpose
**KANGAYATH WEB** is a modern, high-performance digital product-discovery platform for a physical clothing store located in the local panchayat region. The platform connects nearby customers with the physical store by digitizing the store's garment catalog, displaying real-time size and color availability, providing shop operating status, and facilitating direct contact via WhatsApp and phone.

### 1.2 Core Business Vision
> *"Reach nearby customers and make the store's products easily accessible to people within the local panchayat and surrounding areas, encouraging them to visit the physical store to complete their purchases."*

### 1.3 Strategic Boundary: Discovery Platform vs. E-Commerce
KANGAYATH WEB is explicitly **NOT an e-commerce checkout store**. 
- The platform does not take payments, fulfill deliveries, manage shopping carts, or compute shipping fees.
- The final commercial transaction occurs **in person at the physical shop counter**.

---

## 2. Actors & Personas

### 2.1 Actor A: Shop Owner / Store Admin
- **Role**: Curates the physical shop's digital catalog, updates variant availability, manages seasonal promotional sections, and maintains store operating hours.
- **Key Goals**:
  - Update product availability with minimal friction during busy store hours.
  - Showcase new festive collections (e.g., Onam, Christmas, Wedding season) directly to local customers.
  - Broadcast real-time store open/closed status and emergency holiday announcements.
  - Receive direct customer inquiries on WhatsApp.

### 2.2 Actor B: Customer / Local Shopper
- **Role**: Residents in the panchayat and surrounding towns looking for clothing for family, daily wear, or festive occasions.
- **Key Goals**:
  - Browse available clothing designs, fabrics, and patterns from mobile phones.
  - Verify whether specific sizes (e.g., Size 40) or colors (e.g., Maroon) are in stock before traveling to the shop.
  - Save favorite designs for quick reference when visiting the store counter.
  - Check whether the shop is open right now and get directions via Google Maps.
  - Inquire directly with the shop owner via one-click WhatsApp messaging.

---

## 3. Non-Negotiable Business Constraints

1. **No E-Commerce Transactions (MVP)**: No online checkout, payment gateways (Razorpay/Stripe), delivery tracking, or shopping carts. Terminology is strictly **Saved Items** or **Favorites**.
2. **No Initial Authentication / Login (MVP)**:
   - Customers browse and save items anonymously without account creation.
   - Admin features are accessible directly without authentication initially to enable rapid validation and testing.
   - *Security Risk Disclosure*: The lack of admin login exposes management functions to open network access during MVP development. Full authentication architecture is reserved for client-approved Phase 06.
3. **No Pricing Display (MVP)**: Prices are excluded from public catalog displays; customer discussions on price occur via WhatsApp or at the store counter.
4. **Availability Over Inventory**: Management tracks boolean availability (`Available` vs. `Sold Out`) per variant rather than complex numeric stock counts.

---

## 4. Functional Requirements Catalog

### 4.1 Store Information & Status
- **FR-001 (Store Profile Management)**: The admin must be able to configure store name, tagline, description, primary phone, WhatsApp number, full address, panchayat, district, state, pin code, GPS coordinates, and Google Maps URL.
- **FR-002 (Weekly Schedule Configuration)**: The admin must be able to define weekly operating hours for each day of the week (Monday through Sunday) with opening time, closing time, and closed-day toggles.
- **FR-003 (Real-Time Shop Status Calculation)**: The system must automatically determine if the store is currently `OPEN` or `CLOSED` in `Asia/Kolkata` (IST) timezone based on weekly schedules.
- **FR-004 (Manual Shop Status Override)**: The admin must be able to force-override the shop status to `FORCE_OPEN` or `FORCE_CLOSED` with an optional public banner message (e.g., "Closed for Onam festival").
- **FR-005 (Customer Shop Status & Contact Display)**: The customer frontend must prominently display real-time open/closed status, current day's hours, address, clickable phone calling, and interactive Google Maps pin.
- **FR-006 (One-Click WhatsApp Integration)**: The customer frontend must provide direct WhatsApp CTA links pre-filled with context (e.g., general inquiry or specific product inquiry).

### 4.2 Category & Taxonomy Management
- **FR-007 (Category Management)**: The admin must be able to create, view, edit, reorder, and activate/deactivate top-level Categories (e.g., "Men", "Women", "Kids") with display names, unique slugs, descriptions, and thumbnail images.
- **FR-008 (Subcategory Management)**: The admin must be able to create, view, edit, reorder, and activate/deactivate Subcategories belonging to a parent Category (e.g., "Shirts" under "Men", "Sarees" under "Women").
- **FR-009 (2-Level Hierarchy Enforcement)**: The system must strictly enforce a 2-level taxonomy (`Category` $\to$ `Subcategory`). Subcategories cannot contain nested child categories.
- **FR-010 (Category Deletion Guard)**: The system must reject category/subcategory deletion if active products or subcategories reference them.
- **FR-011 (Customer Category Navigation)**: Customers must be able to browse products by Category and Subcategory with clear breadcrumbs and active state highlights.

### 4.3 Product & Image Management
- **FR-012 (Product Creation & Editing)**: The admin must be able to create and edit products with Name, Category, Subcategory, Description, Material, Style Code, and SEO metadata.
- **FR-013 (Product Lifecycle States)**: Products must support four distinct states: `Draft`, `Published`, `Hidden`, and `Archived`.
- **FR-014 (Image Upload & Primary Image)**: The admin must be able to upload up to 6 images per product, set a primary hero image, define alt text, and reorder images.
- **FR-015 (Product Validation Invariants)**: A product cannot transition to `Published` unless it has at least 1 image and at least 1 variant configured.

### 4.4 Variant & Availability Management
- **FR-016 (Controlled Attributes Dictionary)**: The admin must be able to manage standard and custom `SizeOption` (e.g., S, M, L, 32, Free Size) and `ColorOption` (e.g., Maroon, Navy, with hex codes) entities.
- **FR-017 (Product Variant Matrix)**: The admin must be able to generate and manage combinations of Size and Color for a product.
- **FR-018 (Variant Uniqueness)**: The system must prevent duplicate `(Size, Color)` variants within the same product.
- **FR-019 (Variant Availability Toggle)**: The admin must be able to toggle the availability status (`Available` / `Sold Out`) of any individual variant with one click.
- **FR-020 (Product-Level Manual Sold-Out Override)**: The admin must be able to toggle `manual_sold_out` at the product level, immediately marking the entire product as Sold Out regardless of variant states.
- **FR-021 (Derived Aggregate Availability)**: The system must automatically compute product availability based on active variant states and product override flags.
- **FR-022 (Customer Variant Inspection)**: Customers viewing a product must see all available and sold-out size/color combinations with visual badges.

### 4.5 Promotional Custom Sections
- **FR-023 (Custom Section Management)**: The admin must be able to create, edit, activate/deactivate, and reorder custom showcase collections (e.g., "Onam Offers", "New Arrivals", "Casuals") with title, slug, subtitle, and banner image.
- **FR-024 (Section Item Curation & Sorting)**: The admin must be able to add/remove products to/from custom sections and define manual sort order indices.
- **FR-025 (Multi-Section Membership)**: The system must allow a single product to belong to multiple custom sections simultaneously.
- **FR-026 (Section Filtering & Landing Pages)**: Customers must be able to view custom section carousels on the homepage and navigate to dedicated section landing pages (`/sections/[slug]`).

### 4.6 Customer Search, Filtering & Discovery
- **FR-027 (Keyword Search)**: Customers must be able to search products across product name, description, material, and category with case-insensitive partial matching.
- **FR-028 (Faceted Filtering)**: Customers must be able to filter catalog listings simultaneously by Category, Subcategory, Size, Color, Custom Section, and Availability status.
- **FR-029 (Sold-Out Display Governance)**: Sold-out items must display with a clear "Sold Out" visual badge and rank below available items by default.
- **FR-030 (Availability Filter Toggle)**: Customers must be able to toggle "Show Available Only" to exclude sold-out items from search results.
- **FR-031 (Catalog Sorting & Pagination)**: Catalog results must support sorting (`Newest First`, `Name A-Z`) with efficient cursor or offset pagination.

### 4.7 Customer Saved Items (Favorites)
- **FR-032 (Save / Remove Products)**: Customers must be able to save products to their "Saved Items" list with a single click (heart icon) and remove them at will.
- **FR-033 (Unauthenticated Persistence)**: Saved items must persist across browser refreshes and restarts via `localStorage` paired with anonymous session synchronization.
- **FR-034 (Saved Items Availability Badging)**: Saved items must display live availability indicators (e.g., "In Stock" or "Sold Out") and notify the user if an item has been archived.
- **FR-035 (Direct Inquiry from Saved Items)**: Customers must be able to initiate a WhatsApp inquiry referencing all or specific saved items.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance (NFR-001 – NFR-004)
- **NFR-001 (Page Load Times)**: Core customer pages must achieve First Contentful Paint (FCP) $< 1.2\text{s}$ and Largest Contentful Paint (LCP) $< 2.0\text{s}$ on standard 4G mobile connections.
- **NFR-002 (API Response Time)**: Backend API catalog queries must respond with $p95 < 150\text{ms}$.
- **NFR-003 (Image Optimization)**: Product images must be served in modern WebP/AVIF formats with responsive `srcset` scaling.
- **NFR-004 (Admin Update Latency)**: Admin catalog updates (availability toggles, status changes) must reflect on public endpoints in $< 500\text{ms}$.

### 5.2 Responsiveness & UX (NFR-005 – NFR-008)
- **NFR-005 (Mobile-First Layout)**: The customer UI must be tailored for single-thumb mobile interaction (screen widths 360px to 430px) and scale seamlessly to desktop.
- **NFR-006 (Admin Usability)**: The admin interface must support fast on-the-floor mobile phone updates by the store owner without requiring a desktop computer.
- **NFR-007 (Brand Design Compliance)**: Styling must adhere to the warm, refined brand color palette:
  - Base Background / Surface: `#F0EFED`
  - Deep Heritage Dark / Primary Text: `#2A0D0B`
  - Pure Dark / Accent: `#000000`
  - Burgundy / Festive Accent: `#651714`
  - Earthy Plum: `#3C2227`
  - Olive Tone: `#333323`
- **NFR-008 (Subtle Motion)**: Micro-interactions (hover states, modal transitions, heart toggle animations) must be lightweight and $< 200\text{ms}$.

### 5.3 Accessibility & SEO (NFR-009 – NFR-012)
- **NFR-009 (Accessibility)**: Contrast ratios must meet WCAG 2.1 AA standards ($\ge 4.5:1$ for normal text). All interactive controls must support keyboard navigation.
- **NFR-010 (Local SEO Metadata)**: Every public page must contain dynamic Open Graph tags, canonical URLs, semantic HTML5 headings (`<h1>` – `<h6>`), and structured JSON-LD data (`ClothingStore` and `Product` schemas).
- **NFR-011 (Automated Sitemap & Robots)**: Next.js must generate dynamic `sitemap.xml` and `robots.txt` ensuring crawlability of published categories, products, and sections.
- **NFR-012 (Descriptive Alt Text)**: Images must enforce descriptive alt text generation for screen readers and search engines.

### 5.4 Data Integrity & Reliability (NFR-013 – NFR-015)
- **NFR-013 (Single Source of Truth)**: PostgreSQL is the authoritative database; no independent customer catalog cache may deviate from DB state.
- **NFR-014 (Referential Integrity)**: Deletion of categories or subcategories with active products is strictly prohibited at the database and application levels.
- **NFR-015 (Graceful Degradation)**: Customer interface must gracefully handle empty search results, missing images, or temporary network interruptions with user-friendly fallbacks.
