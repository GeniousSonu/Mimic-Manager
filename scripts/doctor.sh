#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "        Mimic Manager Environment Doctor & Preflight      "
echo "=========================================================="

FAILED=0

check_cmd() {
  local name=$1
  local cmd=$2
  if command -v "$cmd" >/dev/null 2>&1; then
    local version
    version=$($cmd --version 2>&1 | head -n 1 || true)
    echo "[PASS] $name found: $version"
  else
    echo "[FAIL] $name ($cmd) not found"
    FAILED=$((FAILED + 1))
  fi
}

check_cmd "Node.js" "node"
check_cmd "pnpm" "pnpm"
check_cmd "PHP" "php"
check_cmd "Composer" "composer"
check_cmd "Docker" "docker"

echo "--- Checking Disk Space ---"
AVAIL_DISK=$(df -h . | awk 'NR==2 {print $4}')
echo "[INFO] Available disk space on workspace mount: $AVAIL_DISK"

echo "--- Checking Network Ports (3000, 6379, 27017) ---"
if command -v ss >/dev/null 2>&1; then
  ss -tuln | grep -E ':(3000|6379|27017)' || echo "[INFO] Target ports currently free or internal"
fi

if [ "$FAILED" -gt 0 ]; then
  echo "=========================================================="
  echo "[FAIL] Environment check failed with $FAILED missing tools"
  echo "=========================================================="
  exit 1
else
  echo "=========================================================="
  echo "[PASS] Environment preflight passed completely"
  echo "=========================================================="
  exit 0
fi
