# KANGAYATH WEB — Engineering Governance & Constitution

**Status**: Active  
**Authoritative Version**: 1.0.0  
**Effective Date**: Phase 01  

---

## 1. Principles of Engineering Excellence

Every line of code and architectural decision in the KANGAYATH WEB project must adhere to the following strict hierarchy of priorities:

$$\text{Correctness} > \text{Architectural Integrity} > \text{Security} > \text{Maintainability} > \text{Reliability} > \text{Scalability} > \text{Speed}$$

### Core Tenets:
1. **Layered Isolation**: Strict separation of concerns across API, Service, Repository, and Database layers.
2. **Explicit Contracts**: All interfaces, API payloads, and inter-service dependencies must be strictly typed and versioned.
3. **Zero Secrets in Code**: No credentials, secrets, tokens, or sensitive values may ever be committed to version control.
4. **Verified Quality**: Code is never considered complete without automated tests, linting, formatting, and type-checking verification.
5. **Phase Discipline**: Work must strictly proceed along defined phase boundaries without premature domain implementation.

---

## 2. Monorepo & Directory Structure

```text
kangayath-web/
├── apps/
│   ├── api/            # Backend service (FastAPI, Python 3.12, SQLAlchemy, Alembic)
│   └── web/            # Frontend application (Next.js App Router, TypeScript, React)
├── packages/           # Shared packages, schemas, and common TypeScript/Python utilities
├── infrastructure/     # Container, database, and infrastructure orchestration scripts
├── docs/               # Architecture records, governance, and onboarding documentation
├── scripts/            # Local developer productivity scripts (dev, test, migration)
├── .github/            # GitHub Actions CI/CD pipelines
├── .gitignore          # Global ignore rules
├── .editorconfig       # Code styling baseline
├── docker-compose.yml  # Local multi-service orchestration
└── README.md           # Developer entry point
```

---

## 3. Backend Architectural Layering (`apps/api`)

The backend follows a strict 4-layer unidirectional architecture:

```text
[API Layer / Route Handlers] (apps/api/app/api/)
            │
            ▼ (calls)
[Service Layer] (apps/api/app/services/)
            │
            ▼ (calls)
[Repository Layer] (apps/api/app/repositories/)
            │
            ▼ (queries)
[Data Layer / Database Models] (apps/api/app/models/ & PostgreSQL)
```

### Layer Rules:
- **API Layer**: Exclusively responsible for HTTP request deserialization, Pydantic validation, status code mapping, and response serialization. Must NOT contain business calculations or direct database queries.
- **Service Layer**: Contains core business logic, validation rules, transactional coordination, and external service client calls. May NOT access HTTP request objects directly.
- **Repository Layer**: Encapsulates all SQLAlchemy queries, CRUD operations, and filtering logic. Returns domain models or entity instances.
- **Dependency Direction**: Downward only. Higher layers may depend on lower layers; lower layers MUST NEVER import or depend on higher layers.

---

## 4. Frontend Architectural Layering (`apps/web`)

```text
apps/web/
├── app/               # Next.js App Router (pages, layouts, route handlers)
├── components/        # Reusable, domain-agnostic UI primitives (buttons, modals, cards)
├── features/          # Feature-sliced domain modules (each containing components, hooks, api calls)
├── hooks/             # Global React hooks
├── lib/               # Utility functions, HTTP client wrappers, helpers
├── services/          # Frontend API integration services
├── types/             # Shared TypeScript type definitions
└── styles/            # CSS styles and design token definitions
```

### Frontend Rules:
- Domain features must be encapsulated in `features/<feature-name>/`.
- Generic UI components must remain stateless or strictly view-focused in `components/`.
- Direct `fetch` calls should be centralized through `lib/api-client.ts` or dedicated `services/` wrappers.

---

## 5. Git & Version Control Governance

### 5.1 Branching Strategy
- `main`: Production-ready release branch. Directly protected; requires passing CI and PR review.
- `develop`: Integration branch for active phase features.
- `feature/<phase>-<description>`: Topic branch for specific phase tasks (e.g., `feature/02-domain-specs`).
- `fix/<issue-description>`: Bug fix branches.
- `hotfix/<critical-fix>`: Direct emergency patches targeting `main`.

### 5.2 Commit Message Convention
Commits must follow Conventional Commits standard:
```text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```
Allowed types:
- `feat`: New feature or capability
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation updates
- `test`: Adding or modifying automated tests
- `chore`: Build system, configuration, or dependency updates
- `ci`: CI/CD pipeline adjustments
- `perf`: Performance optimization
- `security`: Security patches or hardening

### 5.3 Pull Request Rules
Every PR must contain:
1. Clear description of purpose and phase alignment.
2. Summary of changes.
3. Verification evidence (unit/integration test results, lint passes).
4. Confirmation of zero committed secrets.

---

## 6. Security Governance Baseline

1. **Zero Credentials in Git**: Passwords, JWT secrets, database connection strings with passwords, and API keys must NEVER be committed.
2. **Environment Separation**: Configuration is loaded exclusively via environment variables (`.env` files for local dev, secret managers for cloud environments).
3. **CORS Governance**: Backend CORS origins must be explicitly allowlisted. Wildcard (`*`) is strictly forbidden in production.
4. **Input Validation**: All incoming requests must be validated against strict Pydantic schemas (backend) and TypeScript contracts (frontend).
5. **Data Sanitization**: Sensitive user information must be redacted before outputting to log aggregators.

---

## 7. Definition of Done (DoD)

A task or phase is considered **DONE** only when:
- [ ] Code is fully implemented according to architectural layering.
- [ ] Automated tests (unit & integration) pass with $\ge 80\%$ critical path coverage.
- [ ] Linter and formatter (Ruff / ESLint) pass with 0 errors and 0 warnings.
- [ ] Type checker (Mypy / TypeScript `tsc`) passes in strict mode.
- [ ] Relevant documentation and ADRs are created or updated.
- [ ] No secrets or unverified assumptions are introduced.
- [ ] Verification evidence is documented.
