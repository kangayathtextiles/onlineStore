# Shared Packages Boundary

This directory (`packages/`) is reserved for shared libraries, TypeScript type definitions, common utilities, or cross-cutting SDKs across applications in subsequent phases.

## Monorepo Architecture Rule
- Packages must be decoupled and independently testable.
- Applications in `apps/` may consume packages in `packages/`.
- Packages MUST NOT depend on application-level modules in `apps/`.
