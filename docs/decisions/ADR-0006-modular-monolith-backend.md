# ADR-0006: Modular Monolith Backend Architecture

## Status
Accepted

## Context
KANGAYATH WEB serves a single physical clothing store with two distinct frontend consumers (`admin-web` and `customer-web`). We evaluated whether to structure the FastAPI backend as a set of distributed Microservices, a Serverless architecture, or a Modular Monolith.

## Decision
We select a **Modular Monolith** architecture for the FastAPI backend.
The backend is structured into cohesive, domain-aligned modules (`store`, `taxonomy`, `products`, `merchandising`, `saved_items`, `media`) within a single deployable application. Each module contains internal services and repositories, communicating internally via direct Python calls and dependency injection.

## Alternatives Considered
- *Microservices*: Separate services for Catalog, Inventory, Media, and Store Info. Rejected due to extreme operational complexity, distributed transaction overhead, network latency, and unnecessary DevOps burden for a local boutique.
- *Serverless Functions (AWS Lambda / Cloud Run Functions)*: Cold start penalties on image generation and async database connection pooling friction with PostgreSQL.

## Consequences
- **Positive**: Single codebase, ACID transaction guarantees across PostgreSQL tables, ultra-low latency internal module calls, simple CI/CD, and single Docker container deployment.
- **Negative**: Requires strict internal layering discipline to prevent accidental spaghetti cross-imports across modules.
