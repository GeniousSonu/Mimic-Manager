import { describe, it, expect } from 'vitest';
import { GutenbergCompiler, IRDocument } from '../src/index.js';

describe('Reproduction: D-0001 (XSS in Gutenberg Compiler)', () => {
  const compiler = new GutenbergCompiler();

  it('proves that unescaped script tags and javascript: links are dangerous if not sanitized', () => {
    const maliciousDoc: IRDocument = {
      version: '1.0',
      capturedAt: new Date().toISOString(),
      viewports: ['desktop'],
      root: {
        id: 'root',
        type: 'container',
        styles: { desktop: {} },
        children: [
          {
            id: 'h1',
            type: 'heading',
            tag: 'h1',
            text: '<script>alert("xss")</script>',
            styles: { desktop: {} },
          },
          {
            id: 'btn',
            type: 'button',
            text: 'Malicious Button',
            attributes: {
              href: 'javascript:alert(1)',
            },
            styles: { desktop: {} },
          },
        ],
      },
    };

    const markup = compiler.compile(maliciousDoc);

    // After fix, raw script tags must NOT appear in output, and javascript: must be neutralized
    expect(markup).not.toContain('<script>alert("xss")</script>');
    expect(markup).not.toContain('href="javascript:');
  });
});
