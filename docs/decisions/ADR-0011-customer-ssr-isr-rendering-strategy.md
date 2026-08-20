# ADR-0011: Customer Frontend SSR/ISR Rendering Strategy

## Status
Accepted

## Context
The customer-facing digital showroom (`customer-web`) requires high search engine discoverability for local queries (e.g. "clothing store near me", "Onam sarees in Kangayath"), sub-2s Largest Contentful Paint (LCP) on mobile devices, and rich social media Open Graph previews on WhatsApp.

## Decision
We select **Next.js App Router with Hybrid Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR)** for `customer-web`:
- Public catalog listings, category routes, and product detail pages are pre-rendered on the server with automated metadata generation and JSON-LD structured data.
- Interactive elements (Saved items heart toggle, faceted filters drawer, WhatsApp inquiry generator) are client components (`"use client"`).
- Admin dashboard (`admin-web`) uses standard Client-Side Rendering (CSR) for dynamic form reactivity.

## Alternatives Considered
- *Pure Client-Side Single Page App (Vite + React)*: Poor SEO crawlability, blank initial HTML for web crawlers, and degraded social share previews.
- *Pure Static Site Generation (SSG)*: Catalog changes and availability updates would require a full website rebuild to reflect.

## Consequences
- **Positive**: 100% crawlable by Googlebot, instantaneous FCP/LCP on mobile devices, live dynamic Open Graph cards on WhatsApp shares.
- **Negative**: Requires Node.js hosting runtime (or edge serverless runtime) rather than plain static S3/storage bucket hosting.
