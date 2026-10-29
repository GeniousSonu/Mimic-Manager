/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */
import { describe, it, expect } from 'vitest';
import { GutenbergCompiler, IRDocument, IRDocumentSchema } from '../src/index.js';

describe('UI Replicator Intermediate Representation (IR) & Gutenberg Compiler', () => {
  const compiler = new GutenbergCompiler();

  const sampleDoc: IRDocument = {
    version: '1.0',
    title: 'Landing Page Hero Section',
    sourceUrl: 'https://example.com',
    capturedAt: new Date().toISOString(),
    viewports: ['desktop', 'tablet', 'mobile'],
    root: {
      id: 'root-container',
      type: 'container',
      styles: {
        desktop: {
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          backgroundColor: '#ffffff',
        },
      },
      children: [
        {
          id: 'hero-heading',
          type: 'heading',
          tag: 'h1',
          text: 'Ship Faster with Mimic Manager',
          styles: {
            desktop: {
              fontSize: '48px',
              fontWeight: '700',
              textAlign: 'center',
            },
          },
        },
        {
          id: 'hero-desc',
          type: 'paragraph',
          text: 'The autonomous site optimization brain for modern WordPress teams.',
          styles: {
            desktop: {
              fontSize: '18px',
              textAlign: 'center',
            },
          },
        },
        {
          id: 'hero-cta',
          type: 'button',
          text: 'Get Started Free',
          attributes: {
            href: 'https://github.com/GeniousSonu/Mimic-Manager',
          },
          styles: {
            desktop: {},
          },
        },
        {
          id: 'features-columns',
          type: 'columns',
          styles: { desktop: {} },
          children: [
            {
              id: 'col-1',
              type: 'column',
              styles: { desktop: { width: '50%' } },
              children: [
                {
                  id: 'col-1-img',
                  type: 'image',
                  attributes: {
                    src: 'https://example.com/speed.jpg',
                    alt: 'Speed Performance Gauge',
                    width: '600',
                    height: '400',
                  },
                  styles: { desktop: {} },
                },
              ],
            },
            {
              id: 'col-2',
              type: 'column',
              styles: { desktop: { width: '50%' } },
              children: [
                {
                  id: 'col-2-title',
                  type: 'heading',
                  tag: 'h2',
                  text: 'Instant Verification',
                  styles: { desktop: {} },
                },
                {
                  id: 'col-2-list',
                  type: 'list',
                  tag: 'ul',
                  styles: { desktop: {} },
                  children: [
                    { id: 'li-1', type: 'custom', text: '0 console errors', styles: { desktop: {} } },
                    { id: 'li-2', type: 'custom', text: 'Visual diff &le; 1.0%', styles: { desktop: {} } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  it('validates IRDocument against zod schema', () => {
    const parseResult = IRDocumentSchema.safeParse(sampleDoc);
    expect(parseResult.success).toBe(true);
  });

  it('compiles IR nodes to valid WordPress Core Gutenberg blocks', () => {
    const markup = compiler.compile(sampleDoc);

    expect(markup).toContain('<!-- wp:group {"layout":{"type":"flex"}} -->');
    expect(markup).toContain('<!-- wp:heading {"level":1,"textAlign":"center"} -->');
    expect(markup).toContain('<h1 class="wp-block-heading has-text-align-center">Ship Faster with Mimic Manager</h1>');
    expect(markup).toContain('<!-- wp:paragraph {"align":"center"} -->');
    expect(markup).toContain('<!-- wp:buttons -->');
    expect(markup).toContain('<!-- wp:button -->');
    expect(markup).toContain('<!-- wp:columns -->');
    expect(markup).toContain('<!-- wp:column {"width":"50%"} -->');
    expect(markup).toContain('<!-- wp:image {"sizeSlug":"large","width":600,"height":400} -->');
    expect(markup).toContain('<!-- wp:list -->');
    expect(markup).toContain('<!-- wp:list-item -->');
  });

  it('verifies Gutenberg block comment delimiters are perfectly balanced', () => {
    const markup = compiler.compile(sampleDoc);
    const validation = compiler.validateDelimiters(markup);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('detects mismatched or unclosed block delimiters', () => {
    const brokenMarkup = '<!-- wp:group --><div><!-- wp:heading --><h2>Broken</h2><!-- /wp:paragraph --></div><!-- /wp:group -->';
    const validation = compiler.validateDelimiters(brokenMarkup);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors[0]).toContain('Mismatched block closing');
  });
});
