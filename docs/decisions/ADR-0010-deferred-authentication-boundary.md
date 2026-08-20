# ADR-0010: Deferred Authentication & Security Boundary Architecture

## Status
Accepted

## Context
A strict business constraint mandates that authentication/login is not implemented during initial development to allow rapid feature completion and client verification. However, we must ensure that Phase 06 can introduce production-grade authentication (JWT / OAuth2 / API Keys) without redesigning database schemas or refactoring business services.

## Decision
We architect the backend with an explicit, modular security boundary:
1. All admin routes in `/api/v1/admin/*` are wired through a FastAPI dependency placeholder `get_current_admin_user()`.
2. In MVP mode, this dependency acts as a bypass pass-through returning a default administrative context.
3. In Phase 06, the implementation of `get_current_admin_user()` is swapped to validate standard HTTP Bearer JWT tokens or session cookies.
4. Business service classes and repositories remain completely agnostic of HTTP authentication mechanisms.

## Alternatives Considered
- *Implementing temporary basic auth or hardcoded passwords*: Violates client requirement of zero initial login hurdles during testing.
- *Scattering auth checks directly inside route bodies*: Causes severe code coupling and massive refactoring when auth is introduced.

## Consequences
- **Positive**: Zero initial friction for testing; seamless single-point injection of Phase 06 authentication guards with zero changes to domain entities or services.
- **Negative / Risk**: Admin endpoints are openly accessible during development environment stages. Must not be exposed to open public networks without ingress firewalls or VPN.
