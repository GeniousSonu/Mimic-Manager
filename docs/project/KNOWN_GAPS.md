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
