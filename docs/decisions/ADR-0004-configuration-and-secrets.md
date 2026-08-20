# ADR-0004: Configuration Governance and Secret Management Strategy

## Status
Accepted

## Context
Applications require environment-specific settings (database URLs, CORS rules, logging levels, API host bindings) across development, testing, staging, and production without hardcoding secrets or leaking credentials into version control.

## Decision
We enforce:
- **Backend Configuration**: Centralized singleton `Settings` in `app/core/config.py` using `pydantic-settings.BaseSettings`. Direct calls to `os.environ` or `os.getenv` outside this module are forbidden.
- **Frontend Configuration**: Strict prefix isolation (`NEXT_PUBLIC_` for client-exposed variables, undecorated for server-only variables).
- **Zero Secrets**: `.gitignore` strictly ignores `.env`, `.env.*` (while permitting `.env.example`).
- **Templates**: Standard `.env.example` templates provided at the monorepo root and inside application folders.

## Alternatives Considered
- *Scattered `os.getenv` calls*: Prone to runtime missing-key crashes and impossible to validate uniformly at startup.
- *Hardcoded default secrets*: Extreme security risk.

## Consequences
- **Positive**: Startup validation (fail-fast if mandatory configuration is missing or malformed), safe environment promotion, complete secret isolation.
- **Negative**: Developers must initialize `.env.local` files prior to running services locally.
