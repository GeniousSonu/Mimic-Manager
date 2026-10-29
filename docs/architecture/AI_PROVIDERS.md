# Mimic Manager AI Vision & Text Providers Specification

**Status:** ACTIVE  
**Owner-persona:** Machine Learning Architect & Privacy Officer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [PRIVACY.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/security/PRIVACY.md), [USER_STORIES.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/USER_STORIES.md)

---

## 1. Overview & 100% Free / Local Default
Mimic Manager provides automated generation of high-quality, accessible image alt-text and SEO descriptions without requiring any paid API subscription.

### Core Philosophy:
- **Default Engine:** 100% Free & Local via Ollama running open vision models (e.g. `llama3.2-vision` or `moondream2`).
- **Heuristic Fallback:** If no AI vision service is configured or available, Mimic Manager utilizes a smart rule-based fallback (extracting EXIF caption, IPTC headline, post context, and filename normalization).
- **Optional BYOK (Bring Your Own Key):** Users may optionally connect external providers (Gemini Flash, OpenAI, Claude) if they already possess API keys, but no feature is locked behind them.

---

## 2. Provider Abstraction Interface
```typescript
export interface AiVisionProvider {
  readonly id: string;
  readonly isLocal: boolean;
  
  generateAltText(imageBuffer: Buffer, context?: ImageContext): Promise<AltTextResult>;
}

export interface ImageContext {
  filename: string;
  postTitle?: string;
  surroundingText?: string;
  targetLanguage: string;
}

export interface AltTextResult {
  altText: string;
  confidence: number; // 0.0 to 1.0
  provider: string;
  executionTimeMs: number;
}
```

---

## 3. Review Queue & Human Oversight
- Every generated alt-text entry with a confidence score < 0.90 is queued in the Command Center PWA **Alt-Text Review Queue**.
- Users can review with single-key shortcuts: `A` (Accept), `E` (Edit), `R` (Reject).
- Alt-text is only written back to WordPress post metadata after human approval (or if automated batch approval is explicitly enabled by the administrator).

---

## 4. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Privacy Officer** | APPROVED | Confirmed zero external data transmission by default when using the local Ollama provider. |
| **Accessibility Specialist** | APPROVED | Validated inclusion of surrounding article context to prevent generic alt-text like "image of a dog". |
