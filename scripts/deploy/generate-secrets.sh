#!/usr/bin/env bash
# ==============================================================================
# Mimic Manager - Production Secret Generator (CSPRNG)
# Generates high-entropy secrets for Render production deployment.
# NEVER writes to disk or git repository.
# ==============================================================================

set -euo pipefail

echo "=============================================================================="
echo "Mimic Manager - Generated Cryptographic Secrets for Render Blueprint"
echo "Copy each secret and paste into your Render environment / Dashboard."
echo "WARNING: Keep these values confidential. Never commit them to git."
echo "=============================================================================="
echo ""

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MASTER_KMS_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
HMAC_MASTER_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "JWT_SECRET=${JWT_SECRET}"
echo "MASTER_KMS_KEY=${MASTER_KMS_KEY}"
echo "HMAC_MASTER_SECRET=${HMAC_MASTER_SECRET}"
echo ""
echo "=============================================================================="
echo "Generated with Node.js crypto.randomBytes(32) (256-bit entropy)."
echo "=============================================================================="
