# ADR-0001: Monorepo Organization and Directory Boundaries

## Status
Accepted

## Context
KANGAYATH WEB requires a cohesive codebase combining a high-performance Python API service, a Next.js web application, shared packages, infrastructure orchestration, and unified governance. We needed to choose between a multi-repository model or a single monorepo.

## Decision
We organize the project as a structured monorepo:
- `apps/api`: FastAPI backend service
- `apps/web`: Next.js frontend web application
- `packages/`: Shared libraries and schemas
- `infrastructure/`: Docker and cloud orchestration
- `docs/`: Central architecture and governance repository
- `scripts/`: Cross-cutting developer scripts

## Alternatives Considered
- *Multi-repo*: Separate repositories for API and frontend. Rejected due to increased coordination overhead, disconnected documentation, and duplicated CI setup.
- *Flat single-tier project*: Mixing Python and JS in a single root. Rejected due to dependency pollution and toolchain conflicts.

## Consequences
- **Positive**: Single point of truth, synchronized changes across API and Web, unified CI/CD pipelines, streamlined developer onboarding.
- **Negative**: Requires explicit path filtering in CI workflows to avoid unnecessary builds.
