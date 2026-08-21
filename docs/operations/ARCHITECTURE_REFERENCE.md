# KANGAYATH WEB — Architecture Reference

## 1. System Architecture

```
                     [ Internet / Local Customers ]
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │     Nginx Reverse Proxy  │
                    │  (TLS, Headers, Gzip)    │
                    └──────────┬──────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
    ┌────────────────────┐     ┌────────────────────┐
    │  Next.js Frontend  │     │  FastAPI Backend    │
    │  (Port 3000)       │     │  (Port 8000)        │
    │                    │     │                     │
    │  ├── Customer (/)  │     │  ├── /api/v1/public │
    │  └── Admin (/admin)│     │  └── /api/v1/admin  │
    └────────────────────┘     └──────────┬──────────┘
                                          │
                                          ▼
                              ┌────────────────────┐
                              │  PostgreSQL 16      │
                              │  (Port 5432)        │
                              └────────────────────┘
```

## 2. API Namespace Separation

| Namespace | Purpose | Auth Required |
|---|---|---|
| `/api/v1/public/*` | Customer-facing read endpoints | None |
| `/api/v1/admin/*` | Store owner management | Network-level (pending app-level auth) |
| `/health` | Liveness probe | None |
| `/api/v1/health` | Detailed health + DB check | None |

## 3. Data Flow

```
Admin UI → Admin API → Service Layer → Repository → PostgreSQL
                                                         ↑
Customer UI → Public API → Service Layer → Repository ───┘
```

## 4. Key Design Patterns

- **Repository Pattern**: Data access abstracted behind repository classes
- **Service Layer**: Business logic isolated from API handlers
- **Dependency Injection**: FastAPI `Depends()` for session and auth context
- **Async Everything**: Full async stack (asyncpg → SQLAlchemy async → FastAPI)
- **Lifecycle State Machine**: Products follow DRAFT → PUBLISHED → HIDDEN → ARCHIVED

## 5. Database Schema (Core Tables)

| Table | Purpose |
|---|---|
| `stores` | Singleton store profile |
| `operating_schedules` | 7-day weekly hours |
| `store_statuses` | Override mode (AUTO/FORCE_OPEN/FORCE_CLOSED) |
| `categories` | Top-level product categories |
| `subcategories` | Nested under categories |
| `products` | Core product entity (no price fields) |
| `product_images` | Multi-image gallery (max 6) |
| `product_variants` | Size × Color availability matrix |
| `sizes` | Size options (S, M, L, XL, etc.) |
| `colors` | Color options with hex codes |
| `custom_sections` | Promotional collections |
| `custom_section_items` | Product ↔ Section membership |
| `saved_item_collections` | Anonymous wishlist sessions |
| `saved_items` | Saved product references |

## 6. Frontend Architecture

- **App Router**: Next.js 15 file-system routing
- **Route Groups**: `(customer)` for public, `admin` for owner
- **Client Components**: Interactive pages use `"use client"`
- **API Client**: Typed fetch wrapper in `lib/api.ts`
- **Local Storage**: Saved items persisted client-side
- **Design System**: TailwindCSS with brand color tokens (burgundy, wine, plum, charcoal)
