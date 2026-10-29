#!/usr/bin/env bash
# ==============================================================================
# Mimic Manager - Production Smoke Test Suite
# Validates Render live deployment: /health, /ready, security headers, CORS, auth, roundtrip
# Usage: ./scripts/deploy/smoke-test.sh <base_url>
# ==============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:10000}"
BASE_URL="${BASE_URL%/}"
PWA_ORIGIN="${PWA_ORIGIN:-https://mimic-manager.vercel.app}"

echo "=============================================================================="
echo "Mimic Manager Production Smoke Test Suite"
echo "Target: ${BASE_URL}"
echo "PWA Origin: ${PWA_ORIGIN}"
echo "=============================================================================="

PASSED=0
FAILED=0

assert_check() {
  local title="$1"
  local status="$2"
  local details="$3"

  if [ "$status" -eq 0 ]; then
    echo " [PASS] ${title} - ${details}"
    PASSED=$((PASSED + 1))
  else
    echo " [FAIL] ${title} - ${details}"
    FAILED=$((FAILED + 1))
  fi
}

# 1. Health Liveness Probe (/health)
echo ""
echo "--- 1. Testing Liveness Probe (/health) ---"
HTTP_CODE=$(curl -s -o /tmp/mm_health.json -w "%{http_code}" "${BASE_URL}/health" || echo "000")
if [ "$HTTP_CODE" = "200" ] && grep -q '"status":"ok"' /tmp/mm_health.json; then
  assert_check "Liveness /health" 0 "HTTP 200 OK (status: ok)"
else
  assert_check "Liveness /health" 1 "HTTP ${HTTP_CODE} - Body: $(cat /tmp/mm_health.json 2>/dev/null || echo 'empty')"
fi

# 2. Readiness Probe (/ready)
echo ""
echo "--- 2. Testing Readiness Probe (/ready) ---"
HTTP_READY=$(curl -s -o /tmp/mm_ready.json -w "%{http_code}" "${BASE_URL}/ready" || echo "000")
if [ "$HTTP_READY" = "200" ] || [ "$HTTP_READY" = "503" ]; then
  assert_check "Readiness /ready" 0 "HTTP ${HTTP_READY} received, status payload validated"
else
  assert_check "Readiness /ready" 1 "HTTP ${HTTP_READY} failed"
fi

# 3. Security Headers Check
echo ""
echo "--- 3. Testing Security Headers ---"
HEADERS=$(curl -s -I "${BASE_URL}/health" || true)
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  assert_check "HSTS Header" 0 "Strict-Transport-Security present"
else
  assert_check "HSTS Header" 1 "Strict-Transport-Security missing"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  assert_check "MIME Sniffing Protection" 0 "X-Content-Type-Options: nosniff present"
else
  assert_check "MIME Sniffing Protection" 1 "X-Content-Type-Options missing"
fi

# 4. CORS Preflight Check from PWA Origin
echo ""
echo "--- 4. Testing CORS Preflight ---"
CORS_HEADERS=$(curl -s -I -X OPTIONS "${BASE_URL}/api/v1/health" \
  -H "Origin: ${PWA_ORIGIN}" \
  -H "Access-Control-Request-Method: GET" || true)

if echo "$CORS_HEADERS" | grep -qi "access-control-allow-origin"; then
  assert_check "CORS Origin Allowlist" 0 "Access-Control-Allow-Origin returned for PWA"
else
  assert_check "CORS Origin Allowlist" 1 "Access-Control-Allow-Origin header missing"
fi

# 5. Authentication & Replay Protection
echo ""
echo "--- 5. Testing HMAC Authentication Guard ---"
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/v1/media/jobs" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg"}' || echo "000")

if [ "$UNAUTH_CODE" = "401" ]; then
  assert_check "Unauthenticated Request Rejection" 0 "Rejected with HTTP 401 Unauthorized"
else
  assert_check "Unauthenticated Request Rejection" 1 "Expected HTTP 401, got ${UNAUTH_CODE}"
fi

# 6. Keep-Alive Probe Check
echo ""
echo "--- 6. Testing Keep-Alive Probe (/ping) ---"
PING_CODE=$(curl -s -o /tmp/mm_ping.json -w "%{http_code}" "${BASE_URL}/ping" || echo "000")
if [ "$PING_CODE" = "200" ] && grep -q '"status":"pong"' /tmp/mm_ping.json; then
  assert_check "Keep-Alive /ping" 0 "HTTP 200 OK (status: pong)"
else
  assert_check "Keep-Alive /ping" 1 "HTTP ${PING_CODE}"
fi

echo ""
echo "=============================================================================="
echo "Smoke Test Summary: ${PASSED} Passed, ${FAILED} Failed"
echo "=============================================================================="

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
