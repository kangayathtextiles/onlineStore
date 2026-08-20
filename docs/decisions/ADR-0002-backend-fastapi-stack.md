# ADR-0002: Backend Framework and Persistence Stack

## Status
Accepted

## Context
The backend requires an asynchronous, type-safe, high-performance web framework with automatic OpenAPI documentation, schema validation, and mature database integration with PostgreSQL.

## Decision
We adopt:
- **FastAPI**: Modern async web framework with native Pydantic v2 support and auto-generated OpenAPI.
- **SQLAlchemy 2.0 (asyncpg)**: Async ORM and query builder for type-safe database interactions.
- **Alembic**: Database migration management.
- **Ruff & Mypy**: High-speed linting, formatting, and strict static type checking.
- **Pytest**: Asynchronous testing runner.

## Alternatives Considered
- *Django*: Provides a complete batteries-included framework, but has higher overhead and less native async ergonomics compared to FastAPI.
- *Flask*: Lightweight, but lacks native async handling, automatic schema validation, and OpenAPI generation.

## Consequences
- **Positive**: High throughput, minimal boilerplate, automatic interactive Swagger UI (`/docs`), strong typing.
- **Negative**: Async database programming requires strict connection and session management discipline.
