#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
AUDIT_JSON="docs/project/evidence/audit-${TIMESTAMP}.json"
mkdir -p "docs/project/evidence"

echo "=== Running State Audit at $TIMESTAMP ==="

# 1. Audit File Tree non-emptiness
MISSING_FILES=0
check_file() {
  local path=$1
  if [ ! -s "$path" ]; then
    echo "[FAIL] Missing or empty: $path"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
}

check_file "README.md"
check_file "AGENTS.md"
check_file "CHANGELOG.md"
check_file "docs/00-index.md"
check_file "docs/product/PRD.md"
check_file "docs/architecture/ARCHITECTURE.md"
check_file "docs/architecture/DATA_MODEL.md"
check_file "docs/security/THREAT_MODEL.md"
check_file "docs/design/DESIGN.md"
check_file "packages/ui/tokens/tokens.json"

# 2. Check Contrast Gate
echo "--- Checking Contrast Gate ---"
pnpm test:contrast > "docs/project/evidence/contrast-gate.log" 2>&1 || CONTRAST_FAIL=1

# 3. Check Monorepo Unit Tests
echo "--- Checking Unit Tests ---"
pnpm test > "docs/project/evidence/unit-tests.log" 2>&1 || TESTS_FAIL=1

# 4. Check PHPUnit Tests
echo "--- Checking PHPUnit Tests ---"
pnpm test:php > "docs/project/evidence/phpunit-tests.log" 2>&1 || PHP_FAIL=1

# 5. Check PWA Next.js Build
echo "--- Checking PWA Production Build ---"
pnpm --filter @mimic-manager/pwa build > "docs/project/evidence/pwa-build.log" 2>&1 || PWA_FAIL=1

# 6. Check E2E Signed Roundtrip
echo "--- Checking E2E Signed Roundtrip ---"
pnpm vitest run e2e/roundtrip.test.ts > "docs/project/evidence/e2e-roundtrip.log" 2>&1 || E2E_FAIL=1

P_MINUS_1_STATUS="pass"
P0_STATUS="pass"
P1_STATUS="pass"

if [ "$MISSING_FILES" -gt 0 ] || [ "${CONTRAST_FAIL:-0}" -gt 0 ]; then
  P_MINUS_1_STATUS="fail"
fi

if [ "${TESTS_FAIL:-0}" -gt 0 ] || [ "${PHP_FAIL:-0}" -gt 0 ]; then
  P0_STATUS="fail"
fi

if [ "${PWA_FAIL:-0}" -gt 0 ] || [ "${E2E_FAIL:-0}" -gt 0 ]; then
  P1_STATUS="fail"
fi

cat <<EOF > "$AUDIT_JSON"
{
  "timestamp": "$TIMESTAMP",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "audit": {
    "P-1": {
      "name": "Docs & Design Foundation",
      "status": "$P_MINUS_1_STATUS",
      "missingFiles": $MISSING_FILES,
      "contrastGate": "$([ "${CONTRAST_FAIL:-0}" -eq 0 ] && echo 'pass' || echo 'fail')"
    },
    "P0": {
      "name": "Foundations & Risk Spikes",
      "status": "$P0_STATUS",
      "unitTests": "$([ "${TESTS_FAIL:-0}" -eq 0 ] && echo 'pass' || echo 'fail')",
      "phpUnit": "$([ "${PHP_FAIL:-0}" -eq 0 ] && echo 'pass' || echo 'fail')"
    },
    "P1": {
      "name": "Media + AI Metadata + Command Center MVP",
      "status": "$P1_STATUS",
      "pwaBuild": "$([ "${PWA_FAIL:-0}" -eq 0 ] && echo 'pass' || echo 'fail')",
      "e2eRoundtrip": "$([ "${E2E_FAIL:-0}" -eq 0 ] && echo 'pass' || echo 'fail')"
    }
  }
}
EOF

echo "[PASS] Audit written to $AUDIT_JSON"
cat "$AUDIT_JSON"
