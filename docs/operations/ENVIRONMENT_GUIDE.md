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
