#!/usr/bin/env bash
set -euo pipefail

# Atlas Backup Export Script for Mimic Manager
# Free-tier MongoDB Atlas M0 does not provide automated snapshots.
# This script creates a complete timestamped JSON/BSON backup of all collections.
#
# Usage:
#   MONGODB_URI="mongodb+srv://..." ./scripts/backup/atlas-export.sh [output_dir]

BACKUP_ROOT="${1:-./backups/atlas}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

if [ -z "${MONGODB_URI:-}" ]; then
  if [ -f ".env" ]; then
    # Extract MONGODB_URI without printing
    MONGODB_URI=$(grep -E '^MONGODB_URI=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "[-] ERROR: MONGODB_URI environment variable is required."
  exit 1
fi

mkdir -p "${TARGET_DIR}"
echo "[*] Initializing MongoDB Atlas export into: ${TARGET_DIR}"

if command -v mongodump >/dev/null 2>&1; then
  echo "[+] Using mongodump utility..."
  mongodump --uri="${MONGODB_URI}" --out="${TARGET_DIR}/dump" --gzip --quiet
  echo "[+] mongodump complete."
else
  echo "[+] mongodump not found. Running portable Node.js export fallback..."
  node -e '
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

async function run() {
  const uri = process.env.MONGODB_URI;
  const outDir = process.env.TARGET_DIR;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log(`[+] Exporting ${collections.length} collections...`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;
      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(outDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
      console.log(`    - Exported ${docs.length} docs from "${colName}" -> ${colName}.json`);
    }
  } catch (err) {
    console.error("[-] Export failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}
run();
' 
fi

# Create archive
tar -czf "${TARGET_DIR}.tar.gz" -C "${BACKUP_ROOT}" "${TIMESTAMP}"
rm -rf "${TARGET_DIR}"

echo "[✓] Atlas backup successfully created: ${TARGET_DIR}.tar.gz"
echo "[✓] Size: $(du -h "${TARGET_DIR}.tar.gz" | cut -f1)"
