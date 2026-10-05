# KANGAYATH WEB — Environment Configuration Guide

## 1. Environment Tiers

| Tier | `ENVIRONMENT` | `DEBUG` | `CORS` | `docs/redoc` |
|---|---|---|---|---|
| Development | `development` | `true` | `localhost:3000` | Enabled |
| Test | `test` | `false` | `localhost:3000` | Enabled |
| Staging | `staging` | `false` | staging domain | Enabled |
| Production | `production` | `false` | production domain | **Disabled** |

---

## 2. Configuration Sources (Priority Order)

1. **Environment variables** (highest priority)
2. `.env` file in the app directory
3. Default values in `app/core/config.py`

---

## 3. Secret Management

### Development
- Use `.env` files (already `.gitignore`d)
- Use development-safe defaults

### Production
Choose one:
- **AWS Secrets Manager**: Inject via ECS task definitions or Lambda
- **GCP Secret Manager**: Mount as environment variables
- **HashiCorp Vault**: Inject via sidecar or init container
- **Docker Secrets**: Use `docker secret create` with compose

### Required Production Secrets
| Secret | Generation |
|---|---|
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `ADMIN_API_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(32))"` (min 32 chars) |
| `SUPABASE_SERVICE_ROLE_KEY` | Obtained from Supabase Project Settings > API |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |

---

## 4. CORS Configuration

### Development
```
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### Production
```
BACKEND_CORS_ORIGINS=https://kangayath.in,https://www.kangayath.in
```

> **NEVER** use `*` (wildcard) in production CORS origins.

---

## 5. Database Connection

### Development (local)
```
DATABASE_URL=postgresql+asyncpg://kangayath_user:kangayath_dev_password@localhost:5432/kangayath_db
```

### Docker Compose
```
DATABASE_URL=postgresql+asyncpg://kangayath_user:${PASSWORD}@postgres:5432/kangayath_db
```

### Production (managed database)
```
DATABASE_URL=postgresql+asyncpg://kangayath_app:${SECURE_PASSWORD}@db-host:5432/kangayath_prod
```

---

## 6. Storage Backend Configuration

| Variable | Dev / Test | Staging / Production | Description |
|---|---|---|---|
| `STORAGE_BACKEND` | `local` | `supabase` | Dictates media upload handling. `local` is strictly forbidden in production. |
| `MEDIA_ROOT` | `./media` | `/app/media` | Filesystem path used for local media in development. |
| `SUPABASE_URL` | Optional | **Required** | Base project URL (e.g. `https://<project-ref>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Required** | Secret service role key for authoritative backend uploads. |
| `SUPABASE_STORAGE_BUCKET` | Optional | `product-media` | Target Supabase storage bucket name. |

---

## 7. Render Dashboard Manual Steps

For each API service on Render (`kangayath-api` and `kangayath-api-staging`):
1. **Set `ADMIN_API_KEY`**:
   - Generate a secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"` (must be >= 32 characters).
   - Enter it in the Render Dashboard under **Environment** for the API service.
2. **Set `DATABASE_URL`**:
   - Enter your managed PostgreSQL connection string.
3. **Set Supabase Storage Variables**:
   - `SUPABASE_URL`: Project URL from Supabase Project Settings > API.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret from Supabase Project Settings > API.
4. **Set CORS & Site URLs**:
   - `BACKEND_CORS_ORIGINS`: Exact web frontend origin (e.g., `https://kangayath-web.onrender.com`).
   - `SITE_URL`: Exact web frontend origin.

---

## 8. Admin Session Cookie & CSRF Protection

- Admin authentication sets an authoritative `HttpOnly`, `Path=/`, bounded `Max-Age` session cookie named `admin_session`.
- In production/staging (`ENVIRONMENT in ("staging", "production")`), the cookie is issued with `Secure; SameSite=None` (or `SameSite=Lax` if same-origin reverse-proxy is configured).
- State-changing mutations (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookie require a valid `Origin` or `Referer` matching `BACKEND_CORS_ORIGINS` or `SITE_URL` to protect against Cross-Site Request Forgery (CSRF).

