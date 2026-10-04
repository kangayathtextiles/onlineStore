#!/usr/bin/env bash
# ==============================================================================
# KANGAYATH WEB — Post-Deployment Health & Smoke Verification Suite
# ==============================================================================
# Usage: ./scripts/smoke-test.sh [api_base_url] [web_base_url]
# Defaults:
#   API_URL: http://localhost:8000
#   WEB_URL: http://localhost:3000
# ==============================================================================
set -euo pipefail

API_URL="${1:-http://localhost:8000}"
WEB_URL="${2:-http://localhost:3000}"

# Strip trailing slash if present
API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -s -L -o /dev/null -w "%{http_code}" --max-time 45 "${url}" 2>/dev/null || echo "000")

  if [ "${STATUS}" = "${expected}" ]; then
    echo "  ✓ ${name} (HTTP ${STATUS})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${name} (HTTP ${STATUS}, expected ${expected}) -> ${url}"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  KANGAYATH WEB — Smoke Verification"
echo "============================================"
echo "API Endpoint: ${API_URL}"
echo "Web Endpoint: ${WEB_URL}"
echo "Timestamp:    $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# --- 1. API Health & Probes ---
echo "[1/5: API Health & Readiness]"
check "Liveness probe" "${API_URL}/health"
check "API v1 readiness probe" "${API_URL}/api/v1/health"
echo ""

# --- 2. Public Catalog & Store Status Endpoints ---
echo "[2/5: Public Catalog & Showroom APIs]"
check "Showroom store status" "${API_URL}/api/v1/public/store/status"
check "Public categories hierarchy" "${API_URL}/api/v1/public/categories"
check "Public product catalog" "${API_URL}/api/v1/public/products"
check "Public size attributes" "${API_URL}/api/v1/public/attributes/sizes"
check "Public color attributes" "${API_URL}/api/v1/public/attributes/colors"
check "Public curated collections" "${API_URL}/api/v1/public/sections"
echo ""

# --- 3. Digital Catalog & E-Commerce Protection Guarantee ---
echo "[3/5: Digital Catalog & Zero E-Commerce Protection Guarantee]"
PRODUCTS_JSON=$(curl -s --max-time 45 "${API_URL}/api/v1/public/products" 2>/dev/null || echo "{}")
if echo "${PRODUCTS_JSON}" | grep -qiE '"(cart|checkout|payment_gateway|order_total|mrp|cost)"'; then
  echo "  ✗ CRITICAL REGRESSION: Prohibited e-commerce field detected in public products response!"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ Digital catalog guarantee verified: No shopping carts, payment, or checkout fields"
  PASS=$((PASS + 1))
fi

# Assert e-commerce cart/checkout routes do not exist (HTTP 404)
CHECKOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 "${API_URL}/api/v1/public/checkout" 2>/dev/null || echo "000")
if [ "${CHECKOUT_STATUS}" = "404" ]; then
  echo "  ✓ E-commerce checkout endpoint confirmed absent (HTTP 404)"
  PASS=$((PASS + 1))
else
  echo "  ✗ Unexpected checkout endpoint active (HTTP ${CHECKOUT_STATUS})"
  FAIL=$((FAIL + 1))
fi
echo ""

# --- 4. Customer Frontend Pages ---
echo "[4/5: Customer Frontend Routes]"
check "Customer homepage" "${WEB_URL}/"
check "Product catalog page" "${WEB_URL}/products"
check "Visit showroom page" "${WEB_URL}/visit"
check "Saved items wishlist" "${WEB_URL}/saved"
check "Robots crawler instructions" "${WEB_URL}/robots.txt"
check "Dynamic XML sitemap" "${WEB_URL}/sitemap.xml"
echo ""

# --- 5. Admin Security, Route Guards & Portal Routes ---
echo "[5/5: Admin Security & Route Guards]"
# Verify server-side Next.js route guard redirects unauthenticated traffic (HTTP 307)
UNAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 "${WEB_URL}/admin" 2>/dev/null || echo "000")
if [ "${UNAUTH_STATUS}" = "307" ] || [ "${UNAUTH_STATUS}" = "302" ]; then
  echo "  ✓ Next.js server-side admin route guard active (HTTP ${UNAUTH_STATUS} Redirect)"
  PASS=$((PASS + 1))
else
  echo "  ✗ Next.js server-side admin route guard failed (expected 307/302, got HTTP ${UNAUTH_STATUS})"
  FAIL=$((FAIL + 1))
fi

# Verify API router-level admin guard blocks unauthenticated requests (HTTP 401)
API_GUARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 "${API_URL}/api/v1/admin/store" 2>/dev/null || echo "000")
if [ "${API_GUARD_STATUS}" = "401" ]; then
  echo "  ✓ FastAPI router-level admin guard active (HTTP 401 Unauthorized)"
  PASS=$((PASS + 1))
else
  echo "  ✗ FastAPI router-level admin guard failed (expected 401, got HTTP ${API_GUARD_STATUS})"
  FAIL=$((FAIL + 1))
fi

# Verify QR routes are strictly guarded (Vulnerability #1 fix)
QR_GUARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 "${API_URL}/api/v1/admin/qr/lookup?code=SMOKE-TEST" 2>/dev/null || echo "000")
if [ "${QR_GUARD_STATUS}" = "401" ]; then
  echo "  ✓ FastAPI QR security guard active (HTTP 401 Unauthorized)"
  PASS=$((PASS + 1))
else
  echo "  ✗ FastAPI QR security guard failed (expected 401, got HTTP ${QR_GUARD_STATUS})"
  FAIL=$((FAIL + 1))
fi

# Verify Admin pages load with 200 (following auth redirect or directly)
check "Admin login portal" "${WEB_URL}/admin/login"
check "Admin dashboard (protected redirect)" "${WEB_URL}/admin"
check "QR Tag Print Center (protected redirect)" "${WEB_URL}/admin/qr/print"
check "Physical QR Scanner (protected redirect)" "${WEB_URL}/admin/qr/scanner"
check "Shop Status & Info (protected redirect)" "${WEB_URL}/admin/shop"
echo ""

# --- Summary ---
TOTAL=$((PASS + FAIL))
echo "============================================"
echo "  Smoke Test Results: ${PASS}/${TOTAL} checks passed"
if [ "${FAIL}" -gt 0 ]; then
  echo "  STATUS: FAILURES DETECTED (${FAIL} failed)"
  echo "============================================"
  exit 1
else
  echo "  STATUS: ALL CHECKS PASSED (100% HEALTHY)"
  echo "============================================"
  exit 0
fi
