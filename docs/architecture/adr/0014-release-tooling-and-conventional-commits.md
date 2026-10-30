# ADR-0014: Release Tooling (Release-Please) and Conventional Commits

- **Status:** APPROVED
- **Date:** 2026-10-29
- **Context:**
  Mimic Manager is a monorepo containing multiple TypeScript applications, shared packages, and a WordPress PHP connector. Releasing updates requires reliable SemVer version calculation from commit history, generation of CHANGELOG.md following Keep a Changelog standards, automated synchronization of version tags across all package manifests, and creation of GitHub Releases with draft verification.
- **Decision:**
  Adopt **Google Release-Please** (`google-github-actions/release-please-action` v4) driven by strict Conventional Commits enforcement:
  1. Conventional Commits (`feat:`, `fix:`, `feat!:`, `chore:`) parsed automatically to calculate SemVer bumps.
  2. Release-Please runs on every push to `main` and creates or updates a long-lived **Release PR**.
  3. The Release PR updates `CHANGELOG.md`, bumps version strings across the monorepo, and prepares release notes.
  4. Merging the Release PR automatically tags the repository (e.g. `v1.0.0`) and triggers the release asset builder (`release.yml`).
- **Alternatives Considered:**
  - *Semantic-Release:* Widely used, but historically difficult to configure for multi-package monorepos with heterogeneous language stacks (TypeScript + PHP). Releases immediately on merge rather than allowing human review via a Release PR.
  - *Manual Git Tagging & Lerna:* Prone to human error, missed files, and inconsistent changelog formatting.
- **Consequences:**
  - Complete automation of version bumping and changelog maintenance.
  - Humans retain review authority: releases only happen when the Release PR is approved and merged.
  - Monorepo package manifests stay synchronized without developer overhead.
- **Verification:**
  - Conventional Commits verified via commitlint in Git pre-commit hooks and CI.
  - Release dry-run simulation test (`pnpm test:release-dry-run`) proves release notes generation and version bump accuracy.
