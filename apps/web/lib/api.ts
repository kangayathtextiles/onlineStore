/**
 * Unified API Client Facade
 *
 * Decomposed into modular domain clients for maintainability and scalability:
 * - ./api/core: Base transport, HTTP error handling, retry engine, deduplication, and auth state.
 * - ./api/public: Customer-facing endpoints (Store info, Categories, Products discovery, Saved items).
 * - ./api/admin: Staff & inventory management endpoints (Catalog CRUD, Variants, Media, QR Lifecycle, Sections).
 *
 * All modules and types are re-exported here for 100% backward compatibility across apps/web.
 */

export * from "./api/core";
export * from "./api/public";
export * from "./api/admin";
