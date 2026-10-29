# Mimic Manager UI Replicator Intermediate Representation (IR) Specification

**Status:** ACTIVE  
**Owner-persona:** Lead Frontend Architect & Compiler Engineer  
**Last-reviewed:** 2026-10-29  
**Applies-to-version:** v1  
**Related-docs:** [ARCHITECTURE.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/architecture/ARCHITECTURE.md), [UX_SPEC.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/design/UX_SPEC.md), [PRD.md](file:///home/dayshift/Pictures/Mimic%20Manager/docs/product/PRD.md)

---

## 1. Overview & Compiler Pipeline
The UI Replicator captures visual DOM sections from any live web page and compiles them into clean, semantic, modern WordPress Gutenberg blocks (or raw responsive HTML/CSS).

The compilation pipeline operates in four stages:
1. **Headless DOM Capture:** Isolated Chromium extracts DOM tree, computed styles across 3 viewports (360px, 768px, 1280px), and referenced media assets.
2. **Style Diffing & Class Compaction:** Strips non-inherited redundant styles; derives responsive CSS variables and class rules.
3. **IR Compilation:** Converts concrete DOM into semantic `ReplicatorNode` Intermediate Representation.
4. **Target Adapter Emission:** Emits native Gutenberg blocks (`core/group`, `core/columns`, `core/heading`, `core/image`).

---

## 2. Replicator Intermediate Representation (IR) Schema

### 2.1 TypeScript Type Definitions
```typescript
export interface ReplicatorDocument {
  version: '1.0';
  sourceUrl: string;
  capturedAt: string;
  metadata: {
    title: string;
    description?: string;
    originalWidth: number;
    originalHeight: number;
  };
  rootNode: ReplicatorNode;
  designTokens: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacingScale: number[];
  };
}

export type SemanticRole = 
  | 'section' 
  | 'container' 
  | 'grid' 
  | 'flex' 
  | 'heading' 
  | 'paragraph' 
  | 'image' 
  | 'button' 
  | 'card' 
  | 'list' 
  | 'divider';

export interface ResponsiveStyles {
  base: Record<string, string>;
  tablet?: Record<string, string>;  // @media (max-width: 1024px)
  mobile?: Record<string, string>;  // @media (max-width: 640px)
}

export interface ReplicatorNode {
  id: string;
  role: SemanticRole;
  tagName: string;
  attributes: Record<string, string>;
  styles: ResponsiveStyles;
  children: ReplicatorNode[];
  textContent?: string;
  assetRef?: {
    originalUrl: string;
    localKey?: string;
    width: number;
    height: number;
    alt: string;
  };
}
```

---

## 3. Gutenberg Block Mapping Table

| IR Role | Target Gutenberg Core Block | Block Attributes / Configuration | Fallback Construct |
| :--- | :--- | :--- | :--- |
| `section` | `core/group` | `tagName: "section"`, `layout: { type: "constrained" }` | `core/group` (div) |
| `grid` / `flex` | `core/columns` | Responsive column widths derived from flex basis | `core/group` flex layout |
| `heading` | `core/heading` | `level: 1-6` derived from original DOM tag | `core/paragraph` |
| `paragraph` | `core/paragraph` | Text content with inline formatting preserved | `core/paragraph` |
| `image` | `core/image` | Width, height, alt text, and responsive sizes | `core/image` |
| `button` | `core/buttons` > `core/button` | Link URL, text, background/text colors | `core/paragraph` with `<a>` |
| `card` | `core/group` | Styled with border, shadow, and inner padding | `core/group` |

---

## 4. Visual Fidelity Scoring & Thresholds

Fidelity is measured using automated headless comparison:
- **Structural Fidelity Score:** Ratio of successfully mapped semantic nodes (Target: ≥ 95%).
- **Visual Similarity Score (SSIM):** Structural Similarity Index computed between the original page render and the compiled Gutenberg output render (Target: ≥ 90%).
- Any section with an SSIM score < 85% is flagged in the UI with a problem-area heatmap overlay.

---

## 5. Ethical & Legal Guardrails
1. **Ownership Attestation:** The user must explicitly attest to having the legal right or authorization to clone the target design.
2. **Asset Re-hosting:** All referenced external images must be downloaded, converted, and hosted locally on the user's WordPress media library rather than hotlinked.
3. **Trademark / PII Scrubbing:** Logos, email addresses, and phone numbers are highlighted for replacement during the import flow.

---

## 6. Review Log

| Reviewer Persona | Verdict | Findings & Mitigations |
| :--- | :--- | :--- |
| **Principal Frontend Architect** | APPROVED | Validated semantic IR abstraction prevents vendor lock-in to Gutenberg; allows adding Elementor/Bricks adapters later. |
| **Legal & Compliance Counsel** | APPROVED | Confirmed mandatory ownership verification modal and asset local-hosting requirements. |
