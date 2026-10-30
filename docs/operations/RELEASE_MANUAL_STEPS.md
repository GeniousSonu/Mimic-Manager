# Release Manual Steps & Repository Administration Guide

**Status:** ACTIVE  
**Last-reviewed:** 2026-10-30  
**Applies-to:** Repository Administrators & Release Engineers  
**Related-docs:** [VERSIONING.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/VERSIONING.md), [RELEASE_CAPABILITY_MAP.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/RELEASE_CAPABILITY_MAP.md), [UPGRADE_AND_MIGRATION.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/operations/UPGRADE_AND_MIGRATION.md)

---

## 1. Overview

While the build, testing, version checking, and packaging workflows are fully automated in CI/CD, several security and branding settings require manual administrative action in the GitHub repository and external service dashboards. This document provides a click-by-click runbook for repository owners.

---

## 2. GitHub Repository Settings & Presentation

### 2.1 Social Preview & About Section
1. Navigate to your repository page on GitHub: `https://github.com/<owner>/<repo>`.
2. Click the gear icon (`⚙`) next to **About** on the right sidebar.
3. In the **Description** field, paste:
   ```
   Unified open-source, self-hostable site optimization platform. Media compression, tiered PageSpeed fixes, plugin-aware SEO gap fill, Gutenberg UI replicator, and jailed visual file manager.
   ```
4. In the **Website** field, enter your production URL or documentation site.
5. In the **Include in the home page** section, check **Releases** and **Packages**.
6. In the **Topics** field, add the following tags:
   `wordpress`, `wordpress-plugin`, `pagespeed-optimization`, `seo`, `gutenberg`, `file-manager`, `performance`, `nestjs`, `nextjs`, `pwa`, `agpl-v3`
7. Click **Save changes**.
8. Navigate to **Settings** > **General** > **Social preview**.
9. Click **Edit** > **Upload an image**.
10. Select the generated 1280x640 preview image located at `.github/assets/social-preview.png`.
11. Confirm the upload.

---

## 3. Branch Protection & Security Gates

To ensure strict compliance with conventional commits and prevent unverified code from reaching production:

1. Navigate to **Settings** > **Branches**.
2. Click **Add branch ruleset** (or **Add rule**).
3. Name the ruleset: `Main Branch Gate`.
4. Set **Enforcement status** to `Active`.
5. Under **Target branches**, add `default branch` (`main`).
6. Enable the following protections:
   - **Restrict deletions**: Enabled.
   - **Require linear history**: Enabled.
   - **Require a pull request before merging**:
     - Required approvals: `1`.
     - Dismiss stale pull request approvals when new commits are pushed: `Enabled`.
     - Require review from Code Owners: Optional.
   - **Require status checks to pass before merging**:
     - Require branches to be up to date before merging: `Enabled`.
     - Add status checks:
       - `CI Pipeline / test-and-verify`
   - **Block force pushes**: Enabled (never allow force push to main).
7. Click **Save changes**.

---

## 4. GitHub Actions Release Secrets (Optional / On Demand)

When ready to publish updates to WordPress.org SVN or automated distribution:

1. Navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets if using automated WP.org SVN publishing:
   - `WPORG_USERNAME`: WordPress.org account username.
   - `WPORG_PASSWORD`: Application password or SVN token.
3. Ensure default GitHub token permissions:
   - Navigate to **Settings** > **Actions** > **General** > **Workflow permissions**.
   - Select **Read and write permissions** (needed for Release workflow to create GitHub Releases and upload artifacts).
   - Check **Allow GitHub Actions to create and approve pull requests**.
   - Click **Save**.

---

## 5. Performing a Release

1. **Verify Version Sync & Zip Packaging Locally:**
   ```bash
   pnpm version:check
   pnpm lint:spacing
   pnpm test:contrast
   pnpm test:php
   pnpm plugin:build
   pnpm plugin:verify-zip
   pnpm plugin:scan-updater
   ```
2. **Tag and Push:**
   ```bash
   git tag -a v1.0.0-rc.1 -m "chore(release): v1.0.0-rc.1"
   git push origin v1.0.0-rc.1
   ```
3. **Verify GitHub Release:**
   - The `.github/workflows/release.yml` workflow will trigger automatically.
   - It compiles both `dist/mimic-manager.zip` (WP.org clean flavor) and `dist/mimic-manager-github.zip` (GitHub flavor).
   - It calculates SHA256 checksums and attaches all 4 artifacts plus `dist-manifest.json` to the release.
   - Inspect the release page to confirm downloads are available.
