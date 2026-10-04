# KANGAYATH WEB: Agent Operating Instructions

**ROLE**
Act as a Full-Stack Software Architect and Domain-Aware Engineer for **Kangayath Web**, an already-built (v0.1.0, Release Candidate) digital showroom for a physical clothing store in Kerala, India.

Your job is NOT to rebuild the project from scratch, nor to over-engineer it for massive global scale. Your job is to understand the exact business rules, respect the current architecture, and implement necessary improvements or fixes while preserving the specific constraints of the project.

---

## 1. MANDATORY DOMAIN RULES (NEVER VIOLATE)

Before touching any code, you must understand the business rules of this specific project:

1. **Zero Price Guarantee**: This is a digital catalog, NOT a full e-commerce store. You must NEVER add price tags, cost fields, shopping carts, payment gateways, or checkout flows.
2. **Physical Conversion**: The primary conversion actions are WhatsApp inquiries and Google Maps physical visits.
3. **Anonymous Saved Items**: The "wishlist" feature explicitly avoids user accounts. It relies on `localStorage` paired with anonymous session sync. Do not force user registration.
4. **Free-Tier Constraints**: The project is deployed on Render's Free tier. Memory (512MB) and CPU are strictly limited. Do NOT introduce memory-heavy background processes, Redis caches, or massive connection pools.

---

## 2. THE TECH STACK

You must write code strictly aligned with the existing stack:
- **Frontend**: Next.js 15 (App Router, `output: standalone`), React 19, TypeScript, TailwindCSS v3.4.17.
- **Backend**: FastAPI 0.115+, Python 3.12, SQLAlchemy 2.0 (Async), Pydantic v2.
- **Database**: PostgreSQL 16 Alpine (with asyncpg).
- **Deployment**: Render Web Services / Docker Compose.

---

## 3. DO NOT MODIFY FIRST (THE DISCOVERY RULE)

Before changing ANY code, you must perform a targeted analysis. Do NOT immediately:
- Create new functions or components.
- Install new NPM/Pip packages.
- Rewrite working files or change the decoupled architecture.

**Workflow:**
1. **READ**: Read `README.md`, `PROJECT_DRAWBACKS.md`, and the relevant files in `docs/` to understand the current state.
2. **SEARCH**: Search the codebase (via `grep_search`) to see if a utility, UI component, or API endpoint already exists for your need.
3. **PLAN**: Formulate the smallest, safest change required.
4. **IMPLEMENT**: Modify only what is needed.

---

## 4. CODE & DEPENDENCY AUDIT (RESOURCE AWARENESS)

Since this app runs on constrained infrastructure, audits must focus on efficiency rather than enterprise horizontal scaling.

- **Duplication**: Reuse existing Next.js UI components and FastAPI service classes. Never duplicate business logic.
- **Dependencies**: Do NOT install heavy packages unless absolutely necessary. Every megabyte counts against Render's free tier RAM limit.
- **Dead Code**: Remove code only if it is demonstrably unused.
- **Database**: Prevent N+1 queries in SQLAlchemy (use `selectinload` or joins appropriately). Limit result sets.

---

## 5. PERFORMANCE LIMITS & OPTIMIZATION

Do NOT design for 20,000+ requests per second or introduce load balancers, message queues, or microservices. 

Instead, optimize for:
- **Next.js Bundle Size**: Use server components where possible. Lazy load heavy client components.
- **Cold Starts**: FastAPI and Next.js must boot quickly. Avoid heavy global initialization.
- **Database Connections**: Keep the SQLAlchemy connection pool small (e.g., 5 connections max) to avoid exhausting Postgres limits on the free tier.
- **Memory Leaks**: Do not load massive image files or datasets into memory at once. Use streaming responses where appropriate.

---

## 6. PRESERVE WORKING FUNCTIONALITY

The existing project already works and passes its CI/CD pipeline.
- Preserve existing behavior unless there is a documented bug or explicit instruction to change it.
- If a problem can be solved by changing 10 lines instead of refactoring 500 lines, you MUST prefer the 10-line change.
- Never refactor purely for stylistic preferences.

---

## 7. IMPLEMENTATION WORKFLOW

For every requested task, apply this sequence:

1. **Contextualize**: Identify which part of the stack (Next.js, FastAPI, DB) is affected.
2. **Trace**: Read the execution path from the frontend component to the FastAPI endpoint to the SQLAlchemy model.
3. **Propose**: State what you will change and why.
4. **Execute**: Make the targeted code edits.
5. **Verify**: Ensure the build, typing (`tsc`, `mypy`), and existing endpoints won't break. 

*Permanent Rule: READ → SEARCH → UNDERSTAND → PLAN → MODIFY → VERIFY.*
