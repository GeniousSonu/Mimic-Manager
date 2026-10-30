import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('ADDENDUM M (PLUGIN-REPAIR-2) Root Cause Verification', () => {
  const ROOT_DIR = process.cwd();
  const CSS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/css/admin.css');
  const JS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/js/admin.js');
  const PLUGIN_PHP = path.join(ROOT_DIR, 'connectors/wordpress/src/Plugin.php');

  const cssContent = fs.readFileSync(CSS_PATH, 'utf-8');
  const jsContent = fs.readFileSync(JS_PATH, 'utf-8');
  const pluginContent = fs.readFileSync(PLUGIN_PHP, 'utf-8');

  it('[D-0010] body.mm-fullbleed must NEVER set overflow: hidden on body or html', () => {
    // Proves that admin.css does not set overflow: hidden on body.mm-fullbleed
    const cleanedCss = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
    const hasBodyOverflowHidden = /body\.mm-fullbleed\s*\{[^}]*overflow\s*:\s*hidden/i.test(cleanedCss);
    expect(hasBodyOverflowHidden, 'Defect D-0010: body.mm-fullbleed illegally locks body overflow').toBe(false);
  });

  it('[D-0011] File Manager must provide comprehensive context menu groups, multi-select, and command palette', () => {
    // Proves that admin.js currently lacks the complete context menu suite
    const hasMultiSelectMenu = jsContent.includes('mm-context-multi') || jsContent.includes('renderMultiContextMenu');
    const hasCommandPalette = jsContent.includes('mm-command-palette') || jsContent.includes('openCommandPalette');
    const hasArchiveGroup = jsContent.includes('data-action="extract"') || jsContent.includes('compress-zip');
    const hasImageGroup = jsContent.includes('data-action="convert-webp"') || jsContent.includes('preview-image');
    
    expect(hasMultiSelectMenu, 'Defect D-0011: Missing multi-select context menu').toBe(true);
    expect(hasCommandPalette, 'Defect D-0011: Missing Ctrl+K command palette').toBe(true);
    expect(hasArchiveGroup, 'Defect D-0011: Missing archive zip/extract actions').toBe(true);
    expect(hasImageGroup, 'Defect D-0011: Missing image conversion/preview actions').toBe(true);
  });

  it('[D-0012] WordPress plugin must provide UI Replicator Mode A endpoint and draft page creator', () => {
    // Proves that Plugin.php currently lacks replicator REST routes
    const hasReplicatorRoutes = pluginContent.includes('/replicator') || pluginContent.includes('register_replicator_routes');
    const hasDraftCreator = pluginContent.includes('create_draft_page') || pluginContent.includes('/replicator/create-draft');
    
    expect(hasReplicatorRoutes, 'Defect D-0012: Missing replicator REST endpoints in WordPress connector').toBe(true);
    expect(hasDraftCreator, 'Defect D-0012: Missing create draft page REST route').toBe(true);
  });
});
