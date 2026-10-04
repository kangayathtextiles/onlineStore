# KANGAYATH WEB — Current Drawbacks Review

**Assessment date:** 2026-10-03 (Asia/Kolkata)  
**Checkout reviewed:** `staging`, commit `0395f83`  
**Scope:** Current local checkout, including tracked source, configuration, documentation, and pre-existing uncommitted files. This is a static review: tests and live Render services were not checked.

## Executive summary

The main release blockers are the unauthenticated admin API, the upload endpoints' lack of effective size and content safeguards, health checks that can report healthy while the database is down, deployment smoke checks that can pass after failure, and a restore script that suppresses restore errors. The current checkout also contains a loosened `.gitignore`, extensive untracked files, and one unresolved credential-rotation action.

## Critical and high-priority issues

### 1. Admin write and delete APIs have no authentication

**Severity: Critical**

`get_current_admin_user()` returns a placeholder with `authenticated: False`; it does not validate identity or reject the request. The API router mounts every admin router unconditionally. The admin endpoints include product, category, store, section, QR, and media management. The Render blueprint exposes these services as public web services and defines no access restriction.

**Impact:** Anyone who can reach the API can invoke administrative operations, including altering or deleting catalog data and changing store settings. CORS is not an access-control boundary.

**Exact points:** [`apps/api/app/core/dependencies.py:13-26`](apps/api/app/core/dependencies.py#L13-L26), [`apps/api/app/api/v1/api.py:59-68`](apps/api/app/api/v1/api.py#L59-L68), [`render.yaml:16-23`](render.yaml#L16-L23), [`render.yaml:66-73`](render.yaml#L66-L73).

**Fix:** Require real authentication and authorization for all admin API routes before public production use, or put them behind a private access layer until authentication is implemented.

### 2. A GitHub credential was exposed during the previous status check

**Severity: High — unresolved until rotated**

The local `origin` URL contained an embedded GitHub credential, and the diagnostic output displayed it. I removed the credential from the saved remote URL. I cannot verify whether the credential has been revoked or rotated.

**Impact:** The old credential should be treated as exposed. Removing it from the local URL does not invalidate it.

**Fix:** Revoke or rotate that credential in GitHub and check whether it was used elsewhere. The credential value is intentionally omitted from this report.

### 3. Upload size is checked only after the complete file is read into memory

**Severity: High**

Both generic uploads and product-image uploads call `await file.read()` before checking `MAX_UPLOAD_SIZE_MB`. The configured 10 MB limit therefore rejects oversized data only after the application has already buffered it. There is no visible request-size cap or per-client upload rate limit in the API configuration.

**Impact:** Large or repeated requests can use excessive memory and degrade or exhaust API capacity. The unauthenticated admin API makes this easier to exploit.

**Exact points:** [`apps/api/app/api/v1/admin/media.py:38-44`](apps/api/app/api/v1/admin/media.py#L38-L44), [`apps/api/app/services/product_service.py:811-819`](apps/api/app/services/product_service.py#L811-L819), [`apps/api/app/core/security.py:45-50`](apps/api/app/core/security.py#L45-L50).

**Fix:** Enforce a request/body limit while streaming, stop reading when the limit is exceeded, and apply rate and quota controls.

### 4. Upload validation trusts the filename suffix and client-supplied MIME type

**Severity: High**

`validate_upload_file()` checks only the extension and byte count. The upload routes store `file.content_type` from the request, and the media endpoint can return that stored type. The bytes are not decoded or checked to confirm they are a safe image.

**Impact:** Non-image content can be stored with an allowed image suffix and an attacker-selected content type. Because uploads are mounted as admin functionality without authentication, this creates a path for persistent unwanted content and unsafe media responses.

**Exact points:** [`apps/api/app/core/security.py:26-52`](apps/api/app/core/security.py#L26-L52), [`apps/api/app/api/v1/admin/media.py:38-66`](apps/api/app/api/v1/admin/media.py#L38-L66), [`apps/api/app/main.py:199-249`](apps/api/app/main.py#L199-L249).

**Fix:** Decode and validate the actual image format, normalize or re-encode accepted images, set the response MIME type from verified bytes, and serve uploads with safe content-disposition and `nosniff` behavior.

### 5. Render's configured health check is always green, even if PostgreSQL is unavailable

**Severity: High**

The Render services use `/health`. That route always returns `{"status":"healthy"}` without checking the database. A separate detailed route checks PostgreSQL, but it returns a normal HTTP 200 response with a `degraded` body on database failure.

**Impact:** Render and smoke checks can consider the API healthy while customer and admin operations that need PostgreSQL are failing.

**Exact points:** [`render.yaml:23`](render.yaml#L23), [`render.yaml:73`](render.yaml#L73), [`apps/api/app/main.py:153-160`](apps/api/app/main.py#L153-L160), [`apps/api/app/api/v1/endpoints/health.py:38-69`](apps/api/app/api/v1/endpoints/health.py#L38-L69).

**Fix:** Add a readiness endpoint that checks required dependencies and returns a non-2xx status when the database is unavailable; configure Render and smoke tests to use it.

### 6. CI smoke-test failures can still produce a successful workflow

**Severity: High**

The staging and production smoke jobs retry three times, but after all attempts fail they only print notices. They do not exit with a non-zero code. Since each failed command is inside an `if` statement, the shell's default fail-fast behavior does not fail the job for those attempts.

**Impact:** GitHub Actions can show a green deployment verification even when every live smoke test failed.

**Exact points:** [`.github/workflows/staging.yml:170-190`](.github/workflows/staging.yml#L170-L190), [`.github/workflows/production.yml:170-185`](.github/workflows/production.yml#L170-L185).

**Fix:** Exit non-zero after the final failed attempt and make the deployment check a required release gate.

### 7. Smoke verification is not tied to the specific deployment completing

**Severity: High**

The deploy jobs trigger Render hooks (or assume branch auto-deploy) and then immediately start smoke tests against fixed service URLs. The workflow does not wait for a Render deployment identifier/status or verify that the live service is running the commit that triggered the workflow.

**Impact:** A still-healthy previous deployment can pass the smoke checks while the new deployment is queued, failed, or not yet live. This makes a green result weak evidence about the released commit.

**Exact points:** [`.github/workflows/staging.yml:94-150`](.github/workflows/staging.yml#L94-L150), [`.github/workflows/production.yml:94-150`](.github/workflows/production.yml#L94-L150).

**Fix:** Wait for Render's deployment to complete, fail on deployment failure, and verify the deployed revision before running and accepting smoke tests.

### 8. Restore script hides `pg_restore` failures and then prints success

**Severity: High**

The restore pipeline ends with `|| true`, which suppresses failures from decompression or `pg_restore`. The script then prints “Restore completed!” regardless. Its migration-state check and API restart also tolerate errors.

**Impact:** An operator can be told that a restore succeeded when the database restore failed or only partially completed.

**Exact points:** [`scripts/restore.sh:48-72`](scripts/restore.sh#L48-L72).

**Fix:** Preserve pipeline failure status, stop on restore errors, and print success only after explicit database and application checks pass.

### 9. `.gitignore` no longer protects common secrets and generated files

**Severity: High for secret patterns; Medium for repository hygiene**

The modified ignore file no longer ignores `.env.*` generally, private key/certificate files, or a `secrets/` directory. It also no longer ignores `apps/api/media/`, `.next/`, `next-env.d.ts`, or `*.tsbuildinfo`. The current pre-report worktree already had 108 status entries: one modified `.gitignore` and 107 untracked files/folders, including 102 paths under `apps/` and generated/media files.

**Impact:** Environment variants and key material can be accidentally committed; generated build output and uploaded media create substantial review noise and can be committed unintentionally.

**Exact point:** [`.gitignore:1-43`](.gitignore#L1-L43). The current untracked items include `apps/api/media`, `apps/web/.next`, `apps/web/next-env.d.ts`, `apps/web/tsconfig.tsbuildinfo`, `backend/`, `build/`, `daily_report/`, `tree.txt`, and `-ABIN_KR.gitignore`.

**Fix:** Restore explicit secret/key/certificate protections and ignores for the actual media/build paths. Decide which untracked assets are intentional before staging anything.

## Functional and operational drawbacks

### 10. The QR scanner's camera is explicitly disabled by the site's Permissions Policy

**Severity: High for QR scanning**

The scanner requests camera access with `getUserMedia()`, but the site sends `Permissions-Policy: camera=()` on all routes.

**Impact:** Browsers that enforce the policy will deny camera access, so the camera-based QR scanning workflow cannot work as written in the deployed frontend.

**Exact points:** [`apps/web/next.config.ts:23-33`](apps/web/next.config.ts#L23-L33), [`apps/web/app/admin/qr/scanner/page.tsx:80-100`](apps/web/app/admin/qr/scanner/page.tsx#L80-L100).

**Fix:** Allow camera access for the scanner route or appropriate same-origin pages, then verify on mobile browsers.

### 11. Saved-item server synchronization is defined but not used by the frontend

**Severity: Medium**

The frontend context persists favorites only in browser `localStorage`. The API client defines a server sync method, but no frontend call to that method was found; the saved page checks product availability only. The PRD says saved items should use local storage paired with anonymous session synchronization.

**Impact:** Favorites are browser/device-local and do not synchronize through the server session as specified. Clearing browser storage loses the saved list.

**Exact points:** [`apps/web/lib/saved-items-context.tsx:17-45`](apps/web/lib/saved-items-context.tsx#L17-L45), [`apps/web/lib/api.ts:557-568`](apps/web/lib/api.ts#L557-L568), [`docs/requirements/PRD.md:104`](docs/requirements/PRD.md#L104).

**Fix:** Wire the anonymous session token and sync endpoint into context initialization and updates, or amend the product requirement to state that favorites are intentionally browser-only.

### 12. Production services are configured on Render's Free plan

**Severity: Medium; production suitability needs confirmation**

The blueprint sets the production database, API, and frontend to `plan: free`. The staging services are also free.

**Impact:** Production availability, performance, storage, and cold-start behavior depend on free-tier limits rather than a stated production service level. This is a mismatch with the repository's “production ready” claim unless those limits are acceptable for the business.

**Exact points:** [`render.yaml:5-6`](render.yaml#L5-L6), [`render.yaml:16-20`](render.yaml#L16-L20), [`render.yaml:47-50`](render.yaml#L47-L50), [`render.yaml:66-69`](render.yaml#L66-L69), [`render.yaml:95-98`](render.yaml#L95-L98).

**Fix:** Confirm the actual provider limits and choose a paid production plan if the store requires predictable uptime, capacity, or database retention.

### 13. Product images are duplicated in PostgreSQL and on the API filesystem

**Severity: Medium, scaling and cost**

Each upload is written to local disk and also stored as a PostgreSQL `LargeBinary` value. Media reads materialize the image bytes in memory before returning a response. No image resizing or thumbnail generation is present in these upload paths.

**Impact:** The database and backups grow with image volume, uploads use duplicate storage, and concurrent image responses consume API memory. PostgreSQL becomes both the transactional data store and the media delivery store.

**Exact points:** [`apps/api/app/models/stored_media.py:7-20`](apps/api/app/models/stored_media.py#L7-L20), [`apps/api/app/api/v1/admin/media.py:50-66`](apps/api/app/api/v1/admin/media.py#L50-L66), [`apps/api/app/main.py:189-249`](apps/api/app/main.py#L189-L249).

**Fix:** For larger catalogs, store originals and derived image sizes in object storage/CDN and keep only metadata and URLs in PostgreSQL.

### 14. CORS allows every Render-hosted subdomain, not only configured storefront origins

**Severity: Medium security hardening**

Although the blueprint configures specific frontend origins, the API also permits any `*.onrender.com` origin via a broad regex and enables credentialed CORS.

**Impact:** The effective browser-origin policy is wider than the explicit origin list and the security baseline. This weakens the boundary if credentialed browser sessions are added or used later.

**Exact points:** [`apps/api/app/main.py:83-98`](apps/api/app/main.py#L83-L98), [`render.yaml:35-36`](render.yaml#L35-L36), [`docs/security/baseline.md:16-19`](docs/security/baseline.md#L16-L19).

**Fix:** Remove the broad Render subdomain regex in production and allow only the exact staging and production storefront origins required.

### 15. The documented Content Security Policy is not configured

**Severity: Medium security hardening**

The security baseline says a Content Security Policy will be enforced. The Next.js response-header list sets framing, MIME, referrer, and permissions headers but no CSP. The Render blueprint deploys the API and Next.js services directly; it does not route them through the repository's Nginx configuration.

**Impact:** The documented script/content-source restriction is absent from the configured web service.

**Exact points:** [`docs/security/baseline.md:16-19`](docs/security/baseline.md#L16-L19), [`apps/web/next.config.ts:20-37`](apps/web/next.config.ts#L20-L37), [`render.yaml:16-23`](render.yaml#L16-L23), [`render.yaml:47-54`](render.yaml#L47-L54).

**Fix:** Define and test a CSP compatible with the app, or update the baseline if CSP is intentionally deferred.

### 16. Automated dependency vulnerability scanning is missing from the checked-in CI

**Severity: Medium security maintenance**

The security baseline calls for Dependabot, `pip-audit`, and `npm audit`. The checked-in GitHub workflows run linting, type checks, tests, and builds, but do not invoke these dependency audits; `.github` contains no Dependabot configuration.

**Impact:** Known vulnerable dependency updates are not automatically surfaced by the repository's configured CI process.

**Exact points:** [`docs/security/baseline.md:23-25`](docs/security/baseline.md#L23-L25), [`.github/workflows/ci.yml`](.github/workflows/ci.yml), [`.github/workflows/staging.yml`](.github/workflows/staging.yml), [`.github/workflows/production.yml`](.github/workflows/production.yml).

**Fix:** Add dependency review/scanning and automated update configuration, and make the intended checks part of the release gate.

### 17. Production configuration can silently fall back to development secrets

**Severity: Medium configuration risk**

The API configuration provides a hard-coded development `SECRET_KEY` and development PostgreSQL username/password as defaults. There is no production-mode validator that refuses to start when these defaults are still active. The Render blueprint overrides them, but other production deployment paths can omit the variables.

**Impact:** A misconfigured deployment can start with predictable development values instead of failing safely. The current admin dependency does not use `SECRET_KEY`, but it is a dangerous default for future authentication and any code that relies on it.

**Exact points:** [`apps/api/app/core/config.py:41-68`](apps/api/app/core/config.py#L41-L68), [`render.yaml:25-34`](render.yaml#L25-L34).

**Fix:** Validate required secrets and database settings at startup whenever `ENVIRONMENT` is `staging` or `production`; keep development defaults confined to local/test settings.

### 18. Next.js image optimization accepts every HTTPS hostname

**Severity: Medium security/abuse hardening**

`remotePatterns` sets `hostname: "**"`, rather than listing the store's image hosts.

**Impact:** The image optimizer can be asked to fetch arbitrary HTTPS hosts. This broadens outbound fetch and bandwidth-abuse exposure if a product image URL can be controlled or imported from untrusted input.

**Exact point:** [`apps/web/next.config.ts:10-18`](apps/web/next.config.ts#L10-L18).

**Fix:** Restrict remote image domains to the specific trusted hosts used by the project, or serve uploaded images from the same origin.

### 19. Backup command streams a binary archive through a pseudo-terminal

**Severity: Medium operational risk**

The backup script runs `pg_dump --format=custom` through `docker exec -t` and pipes the output into gzip. A pseudo-terminal is intended for interactive text, not a binary dump stream, and can alter or corrupt bytes.

**Impact:** A backup can be produced that appears compressed but cannot be restored reliably.

**Exact point:** [`scripts/backup.sh:30-38`](scripts/backup.sh#L30-L38).

**Fix:** Remove `-t` for the binary dump stream and verify each produced archive with a restore or archive-inspection check.

### 20. Release documentation gives conflicting readiness and version signals

**Severity: Medium release governance**

The README calls the product a production release candidate. The Phase 12 report says it is production ready and claims full passing test/build results, while the release checklist still has every pre-release, deployment, and post-release item unchecked. The Phase 12 report says Tailwind CSS v4, while the frontend manifest declares Tailwind CSS `^3.4.17`; the manifest's web package version is `0.1.0` while the API config and README use `1.0.0`.

**Impact:** Reviewers cannot tell which release checks were actually completed or which versions were shipped from the documentation alone.

**Exact points:** [`README.md:5`](README.md#L5), [`docs/operations/PHASE_12_PRODUCTION_READINESS.md:3-13`](docs/operations/PHASE_12_PRODUCTION_READINESS.md#L3-L13), [`docs/operations/PHASE_12_PRODUCTION_READINESS.md:21`](docs/operations/PHASE_12_PRODUCTION_READINESS.md#L21), [`docs/operations/RELEASE_CHECKLIST.md:1-25`](docs/operations/RELEASE_CHECKLIST.md#L1-L25), [`apps/web/package.json:1-24`](apps/web/package.json#L1-L24), [`apps/api/app/core/config.py:41-46`](apps/api/app/core/config.py#L41-L46).

**Fix:** Reconcile the release status, attach current CI/deployment evidence, complete the release checklist, and align the documented versions with the lockfile and manifests.

## Current repository-state drawbacks

- The local `staging` branch is one commit ahead of local `main`; the latest commit has not reached `main` in the current local refs.
- Before writing this report, the worktree contained 108 status entries: one modified `.gitignore` and 107 untracked entries. The untracked set includes media, build output, reports, and other non-source files.
- The latest commit shown by the local checkout is dated 2026-08-30. This review did not fetch remote branches, so it does not establish whether the remote has advanced since those refs were last updated.
- No tests, type checks, build, smoke checks, or live deployment health checks were run for this review.

## Intended product limitations, not implementation defects

The approved product requirements explicitly exclude online checkout, payment processing, delivery management, and customer-facing price display; purchases are intended to happen in person at the store. These are real limitations for customers who expect a full e-commerce store, but they are documented scope choices rather than defects in the current implementation. See [`docs/requirements/PRD.md:18-20`](docs/requirements/PRD.md#L18-L20) and [`docs/requirements/PRD.md:47-52`](docs/requirements/PRD.md#L47-L52).
