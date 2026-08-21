#!/usr/bin/env bash
# ==============================================================================
# KANGAYATH WEB — Post-Deployment Smoke Test
# ==============================================================================
# Usage: ./scripts/smoke-test.sh [api_base_url] [web_base_url]
# ==============================================================================
set -euo pipefail

API_URL="${1:-http://localhost:8000}"
WEB_URL="${2:-http://localhost:3000}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null || echo "000")

  if [ "${STATUS}" = "${expected}" ]; then
    echo "  ✓ ${name} (HTTP ${STATUS})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${name} (HTTP ${STATUS}, expected ${expected})"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  KANGAYATH WEB — Smoke Test"
echo "============================================"
echo "API: ${API_URL}"
echo "Web: ${WEB_URL}"
echo ""

# --- API Health ---
echo "[API Health Checks]"
check "Root health probe" "${API_URL}/health"
check "API v1 health" "${API_URL}/api/v1/health"
echo ""

# --- Public API Endpoints ---
echo "[Public API Endpoints]"
check "Store status" "${API_URL}/api/v1/public/store/status"
check "Public categories" "${API_URL}/api/v1/public/categories"
check "Public products" "${API_URL}/api/v1/public/products"
check "Public sizes" "${API_URL}/api/v1/public/attributes/sizes"
check "Public colors" "${API_URL}/api/v1/public/attributes/colors"
check "Public sections" "${API_URL}/api/v1/public/sections"
echo ""

# --- Zero Price Verification ---
echo "[Zero Price Guarantee]"
PRODUCTS_JSON=$(curl -s --max-time 10 "${API_URL}/api/v1/public/products" 2>/dev/null || echo "{}")
if echo "${PRODUCTS_JSON}" | grep -qi "price"; then
  echo "  ✗ PRICE FIELD DETECTED in public products response!"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ No price fields in public products response"
  PASS=$((PASS + 1))
fi
echo ""

# --- Frontend ---
echo "[Frontend Pages]"
check "Customer homepage" "${WEB_URL}/"
check "Product catalog" "${WEB_URL}/products"
check "Visit page" "${WEB_URL}/visit"
check "Saved items" "${WEB_URL}/saved"
check "robots.txt" "${WEB_URL}/robots.txt"
check "sitemap.xml" "${WEB_URL}/sitemap.xml"
echo ""

# --- Admin (accessibility check only) ---
echo "[Admin Frontend]"
check "Admin dashboard" "${WEB_URL}/admin"
echo ""

# --- Summary ---
TOTAL=$((PASS + FAIL))
echo "============================================"
echo "  Results: ${PASS}/${TOTAL} passed"
if [ "${FAIL}" -gt 0 ]; then
  echo "  STATUS: ISSUES DETECTED (${FAIL} failures)"
  echo "============================================"
  exit 1
else
  echo "  STATUS: ALL CHECKS PASSED"
  echo "============================================"
  exit 0
fi
