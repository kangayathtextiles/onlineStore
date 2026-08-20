# ADR-0007: Public vs. Admin API Namespace Separation

## Status
Accepted

## Context
The system serves two distinct user personas: Public Customers (browsing catalog, checking store status, saving items) and the Store Owner/Admin (modifying products, variants, availability, schedule). We needed a clear routing and security boundary that prevents internal admin data from leaking to the public while preparing for future authentication.

## Decision
We enforce strict namespace separation at the FastAPI router level:
1. `/api/v1/public/*`: Public, read-optimized endpoints exposing only published, active catalog entities, public store profile, and anonymous saved item synchronization.
2. `/api/v1/admin/*`: Management endpoints capable of mutating state, managing drafts/archived goods, uploading media, and configuring store operations.

## Alternatives Considered
- *Single mixed route tree with permission query params*: Extremely error-prone, risks leaking draft products or admin audit data to public visitors.
- *Two completely separate FastAPI applications*: Unnecessary deployment duplication for shared SQLAlchemy models and core business logic.

## Consequences
- **Positive**: Clear boundary for CORS configuration, rate limiting, future Phase 06 authentication injection, and distinct OpenAPI documentation tags.
- **Negative**: Some endpoints (e.g. fetching a product) have separate public and admin representations.
