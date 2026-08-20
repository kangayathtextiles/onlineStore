# ADR-0012: Media Storage and Image Optimization Pipeline

## Status
Accepted

## Context
High-resolution photos of clothing fabrics, textures, and borders are central to the customer showroom experience. However, unoptimized image uploads can consume massive bandwidth and severely degrade mobile load times over 4G connections.

## Decision
We establish a two-tiered media architecture:
1. **Upload Validation**: Admin uploads are strictly validated (JPEG, PNG, WebP only; max 5MB per file; max 6 images per product).
2. **Storage Strategy**: Local filesystem / Docker volume mounted at `/uploads` during development; seamlessly swappable to S3-compatible Object Storage (AWS S3, Cloudflare R2, MinIO) via an abstract `MediaStorageService` in production.
3. **Delivery & Optimization**: Next.js `next/image` handles on-the-fly WebP/AVIF format conversion, responsive downscaling (`srcset`), and lazy loading on the customer frontend.

## Alternatives Considered
- *Direct database binary storage (BLOB)*: Severe database bloat and memory exhaustion under concurrent requests.
- *Third-party image SaaS (Cloudinary)*: Adds recurring external vendor costs for a local small-business shop.

## Consequences
- **Positive**: Low operational cost, automated WebP compression, zero database bloat, and fast local development.
- **Negative**: Requires disk volume persistence when running on simple VPS containers.
