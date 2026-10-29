# OptiForge Supply Chain Security & Software Bill of Materials (SBOM)

**Status:** ACTIVE  
**Owner-persona:** Lead DevSecOps Engineer & Release Manager  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [SECURITY_ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/SECURITY_ARCHITECTURE.md), [CI_CD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/engineering/CI_CD.md)

---

## 1. Supply Chain Protection Strategy

OptiForge implements strict measures to prevent compromised dependencies from entering the build pipeline:
1. **Pnpm 12 Build Script Policy:** By default, pnpm 12 blocks all arbitrary `postinstall` lifecycle scripts unless explicitly approved via `.npmrc` (`only-built-dependencies`).
2. **Automated Dependabot Security Scanning:** Dependabot scans weekly for vulnerable dependencies and submits automated patch PRs.
3. **Lockfile Freezing in CI:** Production and CI builds enforce `pnpm install --frozen-lockfile` to guarantee identical dependency trees.
4. **Zero-Dependency WordPress Connector:** The WordPress connector ships with 0 external PHP packages, eliminating PHP supply-chain attack vectors.

---

## 2. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **DevSecOps Lead** | APPROVED | Confirmed `.npmrc` only-built-dependencies restrictions prevent rogue package execution during installation. |
| **Release Manager** | APPROVED | Validated frozen lockfile enforcement across all CI workflows. |
