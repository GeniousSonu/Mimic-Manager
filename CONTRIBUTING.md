# Contributing to Mimic Manager

Thank you for your interest in contributing to Mimic Manager! We are committed to building an open, sovereign, and verifiable site optimization platform.

---

## 1. Docs-First Rule

Every contribution that modifies system behavior, APIs, or user interfaces must update the corresponding documentation in the same pull request. All changes follow the autonomous working loop:
`PLAN → RED-TEAM REVIEW → REVISE → GATE-APPROVE → BUILD → SELF-TEST → FIX → REPORT`.

---

## 2. Development Setup

1. Prerequisites:
   - Node.js ≥ 20 (v22 LTS recommended)
   - pnpm ≥ 9 (v12 recommended)
   - PHP ≥ 8.0 & Composer ≥ 2
   - Docker Engine & Docker Compose

2. Clone and install:

   ```bash
   git clone https://github.com/GeniousSonu/Mimic-Manager.git
   cd Mimic-Manager
   pnpm install
   cd connectors/wordpress && composer install && cd ../..
   ```

3. Run tests across the workspace:

   ```bash
   pnpm test
   cd connectors/wordpress && ./vendor/bin/phpunit tests/
   ```

---

## 3. Commit & PR Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `perf:`
- Pull requests must include passing tests and zero lint errors.
- Never commit secrets, API keys, or binary blobs.
- **Developer Certificate of Origin (DCO):** All commits must be signed off with `git commit -s` (`Signed-off-by: Your Name <your@email.com>`). No Contributor License Agreement (CLA) is required.
