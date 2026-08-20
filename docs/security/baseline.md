# Security Baseline & Controls — KANGAYATH WEB

This document establishes the security policies and controls governing the KANGAYATH WEB codebase starting from Phase 01.

---

## 1. Secrets Management
- **Rule**: Absolute Zero Secrets in Git.
- **Enforcement**:
  - Global `.gitignore` rules preventing `.env*` tracking.
  - Secret scanning pre-commit hooks and CI checks.
  - Automated redaction of sensitive log attributes via `app.core.security.sanitize_log_data`.

---

## 2. API & Network Security
- **CORS Protection**: CORS headers are configured via `BACKEND_CORS_ORIGINS`. Production deployments must specify explicit frontend domains; wildcards (`*`) are disallowed.
- **Input Validation**: All inbound JSON payloads are strictly validated using Pydantic models with `extra="forbid"` or explicit type specifications.
- **Security Headers**: Standard security headers (Content Security Policy, X-Content-Type-Options, X-Frame-Options) will be enforced at the reverse proxy/Next.js layers.

---

## 3. Dependency Security
- **Vulnerability Scanning**: Automated Dependabot / pip-audit / npm audit reviews during CI.
- **Pinning Strategy**: Top-level packages pinned with minimum compatible semver bounds (`>=X.Y.Z`).

---

## 4. Production Security Checklist (Phases 11–12)
- [ ] Database credentials rotated and managed via AWS Secrets Manager / GCP Secret Manager / Vault.
- [ ] HTTPS enforced with modern TLS (TLS 1.3).
- [ ] Rate limiting and DDoS protection enabled on edge CDN/Ingress.
- [ ] Role-Based Access Control (RBAC) enforced on all administrative endpoints (Phase 06).
