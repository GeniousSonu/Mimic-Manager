import { IRNode, IRDocument } from './types.js';

export interface GutenbergSerializeOptions {
  includeResponsiveStyles?: boolean;
}

export class GutenbergCompiler {
  /**
   * Compiles an entire IRDocument into Gutenberg Block Markup.
   */
  public compile(doc: IRDocument, options: GutenbergSerializeOptions = {}): string {
    return this.serializeNode(doc.root, options).trim();
  }

  /**
   * Serializes an individual IRNode and its children recursively into Gutenberg block comments.
   */
  public serializeNode(node: IRNode, options: GutenbergSerializeOptions = {}): string {
    switch (node.type) {
      case 'container':
        return this.serializeContainer(node, options);

      case 'columns':
        return this.serializeColumns(node, options);

      case 'column':
        return this.serializeColumn(node, options);

      case 'heading':
        return this.serializeHeading(node);

      case 'paragraph':
        return this.serializeParagraph(node);

      case 'image':
        return this.serializeImage(node);

      case 'button':
        return this.serializeButton(node);

      case 'list':
        return this.serializeList(node, options);

      case 'custom':
      default:
        return this.serializeCustom(node);
    }
  }

  private serializeContainer(node: IRNode, options: GutenbergSerializeOptions): string {
    const layout = node.styles.desktop.display === 'flex' ? { type: 'flex' } : { type: 'constrained' };
    const attrs = JSON.stringify({ layout });
    const innerContent = (node.children || [])
      .map(child => this.serializeNode(child, options))
      .join('\n');

    return `<!-- wp:group ${attrs} -->\n<div class="wp-block-group">\n${innerContent}\n</div>\n<!-- /wp:group -->`;
  }

  private serializeColumns(node: IRNode, options: GutenbergSerializeOptions): string {
    const innerContent = (node.children || [])
      .map(child => this.serializeNode(child, options))
      .join('\n');

    return `<!-- wp:columns -->\n<div class="wp-block-columns">\n${innerContent}\n</div>\n<!-- /wp:columns -->`;
  }

  private serializeColumn(node: IRNode, options: GutenbergSerializeOptions): string {
    const width = node.styles.desktop.width ? { width: node.styles.desktop.width } : {};
    const attrs = Object.keys(width).length > 0 ? ` ${JSON.stringify(width)}` : '';
    const innerContent = (node.children || [])
      .map(child => this.serializeNode(child, options))
      .join('\n');

    return `<!-- wp:column${attrs} -->\n<div class="wp-block-column">\n${innerContent}\n</div>\n<!-- /wp:column -->`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private sanitizeUri(uri: string): string {
    const trimmed = uri.trim();
    if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
      return '#';
    }
    return trimmed;
  }

  private serializeHeading(node: IRNode): string {
    const levelMatch = node.tag?.match(/^h([1-6])$/i);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 2;
    const textAlign = node.styles.desktop.textAlign || 'left';
    const attrsObj: Record<string, any> = { level };
    if (textAlign !== 'left') {
      attrsObj.textAlign = textAlign;
    }
    const attrs = JSON.stringify(attrsObj);
    const text = this.escapeHtml(node.text || '');

    const alignClass = textAlign !== 'left' ? ` has-text-align-${textAlign}` : '';
    return `<!-- wp:heading ${attrs} -->\n<h${level} class="wp-block-heading${alignClass}">${text}</h${level}>\n<!-- /wp:heading -->`;
  }

  private serializeParagraph(node: IRNode): string {
    const textAlign = node.styles.desktop.textAlign;
    const attrsObj: Record<string, any> = {};
    if (textAlign && textAlign !== 'left') {
      attrsObj.align = textAlign;
    }
    const attrs = Object.keys(attrsObj).length > 0 ? ` ${JSON.stringify(attrsObj)}` : '';
    const alignClass = textAlign && textAlign !== 'left' ? ` has-text-align-${textAlign}` : '';
    const text = this.escapeHtml(node.text || '');

    return `<!-- wp:paragraph${attrs} -->\n<p class="${alignClass.trim()}">${text}</p>\n<!-- /wp:paragraph -->`;
  }

  private serializeImage(node: IRNode): string {
    const src = this.sanitizeUri(node.attributes?.src || '');
    const alt = this.escapeHtml(node.attributes?.alt || '');
    const width = node.attributes?.width ? parseInt(node.attributes.width, 10) : undefined;
    const height = node.attributes?.height ? parseInt(node.attributes.height, 10) : undefined;

    const attrsObj: Record<string, any> = { sizeSlug: 'large' };
    if (width) attrsObj.width = width;
    if (height) attrsObj.height = height;

    const attrs = JSON.stringify(attrsObj);
    const dimAttrs = `${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}`;

    return `<!-- wp:image ${attrs} -->\n<figure class="wp-block-image size-large"><img src="${src}" alt="${alt}"${dimAttrs}/></figure>\n<!-- /wp:image -->`;
  }

  private serializeButton(node: IRNode): string {
    const href = this.sanitizeUri(node.attributes?.href || '#');
    const text = this.escapeHtml(node.text || 'Button');

    return `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${href}">${text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
  }

  private serializeList(node: IRNode, options: GutenbergSerializeOptions): string {
    const isOrdered = node.tag?.toLowerCase() === 'ol';
    const blockName = isOrdered ? 'wp:list {"ordered":true}' : 'wp:list';
    const tag = isOrdered ? 'ol' : 'ul';

    const items = (node.children || [])
      .map(child => `<!-- wp:list-item -->\n<li>${this.escapeHtml(child.text || '')}</li>\n<!-- /wp:list-item -->`)
      .join('\n');

    return `<!-- ${blockName} -->\n<${tag} class="wp-block-list">\n${items}\n</${tag}>\n<!-- /wp:list -->`;
  }

  private serializeCustom(node: IRNode): string {
    const html = node.text || '';
    return `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`;
  }

  /**
   * Validates delimiter balance of Gutenberg block comments.
   */
  public validateDelimiters(markup: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const openTags: string[] = [];

    const tagRegex = /<!--\s*(\/)?wp:([a-z0-9\/-]+)(?:\s+(\{.*?\}))?\s*-->/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(markup)) !== null) {
      const isClosing = Boolean(match[1]);
      const blockName = match[2];

      // Void / Self-closing block checks (none in standard WP core blocks without closing comment)
      if (!isClosing) {
        openTags.push(blockName);
      } else {
        if (openTags.length === 0) {
          errors.push(`Unexpected closing block <!-- /wp:${blockName} --> with no open tag`);
        } else {
          const lastOpen = openTags.pop();
          if (lastOpen !== blockName) {
            errors.push(`Mismatched block closing: expected <!-- /wp:${lastOpen} -->, found <!-- /wp:${blockName} -->`);
          }
        }
      }
    }

    if (openTags.length > 0) {
      errors.push(`Unclosed blocks remaining: ${openTags.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
