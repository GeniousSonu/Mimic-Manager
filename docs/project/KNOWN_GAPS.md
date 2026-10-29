# Known Gaps & Deferred Items

All items listed here are intentional architectural boundaries, out-of-scope features, or future roadmap items. No fake, stubbed, or mocked implementations are permitted in production code paths without being logged in this document.

---

## 1. Intentional Architectural Scope Exclusions

| Area | Feature | Status | Rationale / Alternative Provided |
|---|---|---|---|
| **Caching** | Full-Page Caching & Edge Cache | OUT OF SCOPE | Better handled by battle-tested plugins (WP Rocket, LiteSpeed) and CDNs (Cloudflare). Mimic Manager provides cache-purge hooks and Cloudflare guidance. |
| **CDN** | Global CDN Edge Delivery | OUT OF SCOPE | Commodity edge CDNs (Cloudflare, Fastly, Bunny) already excel at this. Mimic Manager generates optimized local assets and rewrite instructions. |
| **Hosting** | Server Config Mutation (Auto Nginx/Apache edit) | OUT OF SCOPE (SAFETY) | Modifying `/etc/nginx/nginx.conf` directly from PHP or Node.js presents unacceptable availability and security risks. Guided copy-paste snippets provided instead. |
| **Video** | Heavy Video Transcoding (FFmpeg H.264/AV1) | DEFERRED (PHASE 7) | High CPU and GPU requirements; will be added in a future phase with optional hardware acceleration flags. |
| **PDF** | PDF Compression & Rasterization | DEFERRED (PHASE 7) | Requires Ghostscript or Poppler; targeted for post-v1 plugin extension. |

---

## 2. In-Progress & Phase Dependencies

- **Phase 0 Active:** Currently constructing foundational monorepo, SSRF guard, cross-language HMAC primitives, and minimal vertical slice.
- **AI Providers:** Ollama and Heuristic providers are foundational. Proprietary commercial providers (OpenAI, Anthropic, Gemini) are strictly optional BYOK (Bring Your Own Key).

---

## 3. Verified Identity Items (Master Prompt Addendum H)

All identity fields confirmed by owner and verified reachable via HTTP/2 200:
- **Product Name:** `Mimic Manager` (confirmed by owner)
- **Creator Domain:** `www.genioussonu.me` (verified reachable HTTP/2 200)
- **Owner Domain:** `www.wefik.in` (verified reachable HTTP/2 200)
- Zero open identity gaps.

---

## 4. Owner-Supplied Assets & Polish Layer Status (Addendum J)

- **Menu Icon SVG:** Flat single-color 20x20 Shifted Stack mark vector-projected from `packages/ui/brand/mark.svg` via `scripts/plugin/generate-assets.ts`. Status: Functional & tested across all 8 WordPress admin color schemes via `fill="currentColor"`. If owner requires an artisan hand-tuned 20x20 SVG, owner may supply custom Shifted Stack SVG.
- **Directory Artwork:** High-fidelity directory banners (772x250, 1544x500 retina), icons (128x128, 256x256), and screenshots (1-5) in `connectors/wordpress/.wordpress-org/` generated from verified brand assets (`packages/ui/brand/mark.svg`). Marked as brand-based versions; owner can supply optional photorealistic 3D renders with custom license attribution in `THIRD_PARTY_LICENSES.md`.
- **Zero Stubs:** All polish components (boot sequence, error boundaries, 4px grid spacing, toast provider with 10s undo, empty states, skeletons) are fully implemented, verified, and backed by Playwright E2E tests.

