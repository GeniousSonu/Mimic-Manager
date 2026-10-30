import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Addendum L (PLUGIN-REPAIR) Root Cause Verification', () => {
  const ROOT_DIR = process.cwd();
  const JS_PATH = path.join(ROOT_DIR, 'connectors/wordpress/assets/js/admin.js');
  const jsContent = fs.readFileSync(JS_PATH, 'utf-8');

  it('[D-0005] WordPress menu and in-app left rail must be defined in admin.js', () => {
    // Proves that admin.js does NOT currently render an in-app persistent left rail
    const hasLeftRail = jsContent.includes('mm-app-rail') || jsContent.includes('mm-in-app-rail');
    expect(hasLeftRail).toBe(true);
  });

  it('[D-0006] File Manager right-click context menu and elevation banner must exist in admin.js', () => {
    // Proves that admin.js does NOT currently implement a context menu or elevation banner
    const hasContextMenu = jsContent.includes('mm-context-menu') || jsContent.includes('showContextMenu');
    const hasElevationBanner = jsContent.includes('mm-elevation-banner') || jsContent.includes('enableWriteMode');
    expect(hasContextMenu).toBe(true);
    expect(hasElevationBanner).toBe(true);
  });

  it('[D-0007] Sites / Connection pairing code flow must exist in admin.js', () => {
    // Proves that admin.js does NOT currently render a pairing code view or generate pairing code
    const hasPairingFlow = jsContent.includes('mm-pairing-code') || jsContent.includes('generatePairingCode');
    expect(hasPairingFlow).toBe(true);
  });

  it('[D-0008] Media UI compress/convert wizard and gallery must exist in admin.js', () => {
    // Proves that admin.js does NOT currently implement the media gallery and compress wizard
    const hasMediaGallery = jsContent.includes('mm-media-grid') || jsContent.includes('renderMediaView');
    const hasCompressWizard = jsContent.includes('mm-compress-wizard') || jsContent.includes('openCompressWizard');
    expect(hasMediaGallery).toBe(true);
    expect(hasCompressWizard).toBe(true);
  });
});
