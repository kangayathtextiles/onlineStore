# ADR-0003: Frontend Architecture and Next.js Framework

## Status
Accepted

## Context
The frontend application requires high rendering performance, excellent SEO capabilities, server and client component flexibility, and modern styling and testing ecosystems.

## Decision
We adopt:
- **Next.js (App Router)**: Modern React framework supporting Server Components, static generation, dynamic rendering, and optimized asset bundling.
- **TypeScript**: Strict compile-time safety across all components and API interactions.
- **Tailwind CSS**: Utility-first CSS framework for expressive, maintainable, and lightweight styling.
- **Vitest & React Testing Library**: Blazing fast unit and component testing runner.

## Alternatives Considered
- *Vite + React SPA*: Fast developer experience, but lacks native Server-Side Rendering (SSR) and built-in SEO optimizations.
- *Remix*: Strong alternative, but Next.js offers larger ecosystem support and tighter enterprise tooling integration.

## Consequences
- **Positive**: Rich hybrid rendering, automatic font/image optimizations, modular App Router architecture.
- **Negative**: Requires developers to understand Server Component vs. Client Component boundaries (`"use client"`).
