# ==============================================================================
# Multi-stage Dockerfile for KANGAYATH WEB (Next.js)
# ==============================================================================
FROM node:20.18.3-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder Stage
FROM node:20.18.3-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept NEXT_PUBLIC_ vars as build args so they are baked into the Next.js bundle
ARG NEXT_PUBLIC_API_URL=https://api.kangayath.site
ARG NEXT_PUBLIC_SITE_URL=https://kangayath.site
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Runner Stage
FROM node:20.18.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=https://api.kangayath.site
ARG NEXT_PUBLIC_SITE_URL=https://kangayath.site
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ensure public directory exists
RUN mkdir -p /app/public

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]

