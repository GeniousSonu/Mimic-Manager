#!/usr/bin/env node
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '../..');
const BRAND_CONFIG_PATH = path.join(ROOT_DIR, 'brand.config.json');

if (!fs.existsSync(BRAND_CONFIG_PATH)) {
  console.error(`Error: brand.config.json not found at ${BRAND_CONFIG_PATH}`);
  process.exit(1);
}

const brand = JSON.parse(fs.readFileSync(BRAND_CONFIG_PATH, 'utf-8'));

console.log(`[brand:apply] Applying brand configuration for "${brand.product.name}" (v${brand.product.version})...`);

// 1. Generate packages/config/src/brand.generated.ts
const tsBrandGeneratedPath = path.join(ROOT_DIR, 'packages/config/src/brand.generated.ts');
const tsContent = `/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | AGPL-3.0-or-later */
// DO NOT EDIT - Generated automatically by pnpm brand:apply from brand.config.json

export const BRAND = ${JSON.stringify(brand, null, 2)} as const;

export const PRODUCT_NAME = BRAND.product.name;
export const PRODUCT_SLUG = BRAND.product.slug;
export const PRODUCT_VERSION = BRAND.product.version;
export const CREATOR_NAME = BRAND.creator.displayName;
export const CREATOR_WEBSITE = BRAND.creator.websiteUrl;
export const OWNER_ORGANIZATION = BRAND.owner.organization;
export const OWNER_WEBSITE = BRAND.owner.website;

export const IDENTIFIERS = BRAND.identifiers;
`;

fs.writeFileSync(tsBrandGeneratedPath, tsContent, 'utf-8');
console.log(`[brand:apply] Generated: packages/config/src/brand.generated.ts`);

// 2. Generate connectors/wordpress/includes/Brand.php
const phpBrandGeneratedPath = path.join(ROOT_DIR, 'connectors/wordpress/includes/Brand.php');
const phpContent = `<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */
// DO NOT EDIT - Generated automatically by pnpm brand:apply from brand.config.json

declare(strict_types=1);

namespace ${brand.identifiers.phpNamespace};

final class Brand
{
    public const NAME = '${brand.product.name}';
    public const SLUG = '${brand.product.slug}';
    public const VERSION = '${brand.product.version}';
    public const CREATOR = '${brand.creator.displayName}';
    public const CREATOR_URL = '${brand.creator.websiteUrl}';
    public const OWNER = '${brand.owner.organization}';
    public const OWNER_URL = '${brand.owner.website}';
    public const TEXT_DOMAIN = '${brand.identifiers.wpTextDomain}';
    public const REST_NAMESPACE = '${brand.identifiers.wpRestNamespace}';
    public const OPTION_PREFIX = '${brand.identifiers.wpOptionPrefix}';
    public const HOOK_PREFIX = '${brand.identifiers.wpHookPrefix}';
    public const TABLE_PREFIX = '${brand.identifiers.wpDbTablePrefix}';
    public const HTTP_HEADER_PREFIX = '${brand.identifiers.httpHeaderPrefix}';
    public const USER_AGENT = '${brand.identifiers.userAgent}';
}
`;

fs.writeFileSync(phpBrandGeneratedPath, phpContent, 'utf-8');
console.log(`[brand:apply] Generated: connectors/wordpress/includes/Brand.php`);

// 3. Update connectors/wordpress/composer.json
const composerJsonPath = path.join(ROOT_DIR, 'connectors/wordpress/composer.json');
if (fs.existsSync(composerJsonPath)) {
  const composer = JSON.parse(fs.readFileSync(composerJsonPath, 'utf-8'));
  composer.name = brand.identifiers.composerPackage;
  composer.description = brand.product.description;
  composer.homepage = brand.owner.website;
  composer.authors = [
    {
      name: brand.creator.displayName,
      homepage: brand.creator.websiteUrl,
      role: brand.creator.role,
    },
  ];
  composer.license = brand.licenses.wordpressPlugin;
  composer.autoload = composer.autoload || {};
  composer.autoload['psr-4'] = {
    [`${brand.identifiers.phpNamespace}\\`]: 'src/',
    [`${brand.identifiers.phpNamespace}\\Includes\\`]: 'includes/',
  };
  composer['autoload-dev'] = composer['autoload-dev'] || {};
  composer['autoload-dev']['psr-4'] = {
    [`${brand.identifiers.phpNamespace}\\Tests\\`]: 'tests/',
  };
  fs.writeFileSync(composerJsonPath, JSON.stringify(composer, null, 2) + '\n', 'utf-8');
  console.log(`[brand:apply] Updated: connectors/wordpress/composer.json`);
}

// 3b. Generate connectors/wordpress/mimic-manager.php
const mainPluginFile = path.join(ROOT_DIR, 'connectors/wordpress/mimic-manager.php');
const mainPluginContent = `<?php
/**
 * Plugin Name: ${brand.product.name}
 * Plugin URI: ${brand.owner.website}
 * Description: ${brand.product.description} Created by ${brand.creator.displayName}. A ${brand.owner.organization} project.
 * Version: ${brand.product.version}
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: ${brand.creator.displayName}
 * Author URI: ${brand.creator.websiteUrl}
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: ${brand.identifiers.wpTextDomain}
 * Domain Path: /languages
 */

/*! ${brand.product.name} | (c) ${brand.copyright.yearRange} ${brand.owner.organization} | Created by ${brand.creator.displayName} | GPL-2.0-or-later */

declare(strict_types=1);

namespace ${brand.identifiers.phpNamespace};

defined('ABSPATH') || exit;

// Autoloader fallback
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
require_once __DIR__ . '/includes/Brand.php';
`;
fs.writeFileSync(mainPluginFile, mainPluginContent, 'utf-8');
console.log(`[brand:apply] Generated: connectors/wordpress/mimic-manager.php`);

// 3c. Generate connectors/wordpress/readme.txt
const readmeTxtFile = path.join(ROOT_DIR, 'connectors/wordpress/readme.txt');
const readmeTxtContent = `=== ${brand.product.name} ===
Contributors: wefik, genioussonu
Donate link: ${brand.owner.website}
Tags: performance, optimization, images, seo, speed
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: ${brand.product.version}
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

${brand.product.tagline}

== Description ==

${brand.product.description}
Created by ${brand.creator.displayName}. A ${brand.owner.organization} project.

== External Services ==

This plugin communicates with your self-hosted ${brand.product.name} backend API using mutual HMAC-SHA256 authentication for media optimization, PageSpeed audits, and UI section replication.
Zero third-party telemetry. 100% data sovereignty.

== Changelog ==

= ${brand.product.version} =
* Official ${brand.product.name} release.
`;
fs.writeFileSync(readmeTxtFile, readmeTxtContent, 'utf-8');
console.log(`[brand:apply] Generated: connectors/wordpress/readme.txt`);

// 3d. Update apps/pwa/public/manifest.json
const manifestPath = path.join(ROOT_DIR, 'apps/pwa/public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.name = `${brand.product.name} Command Center`;
  manifest.short_name = brand.product.shortName;
  manifest.description = brand.product.description;
  manifest.theme_color = brand.visual.accent;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`[brand:apply] Updated: apps/pwa/public/manifest.json`);
}

// 4. Generate NOTICE file at repository root
const noticePath = path.join(ROOT_DIR, 'NOTICE');
const noticeContent = `Mimic Manager
Copyright (c) 2026 Wefik
Created by SK Sahinur Islam (https://www.genioussonu.me/plugin/mimic-manager)
Official Website: https://www.wefik.in

This product includes software developed by Wefik and its contributors.

Open Source Components & Attributions:
- Next.js (MIT License) - Copyright (c) Vercel, Inc.
- NestJS (MIT License) - Copyright (c) 2017-2026 Kamil Mysliwiec
- Sharp (Apache-2.0) - Copyright (c) Lovell Fuller
- Fastify (MIT License) - Copyright (c) Fastify contributors
- Tailwind CSS (MIT License) - Copyright (c) Tailwind Labs, Inc.
- Lucide Icons (ISC License) - Copyright (c) Lucide Contributors
`;
fs.writeFileSync(noticePath, noticeContent, 'utf-8');
console.log(`[brand:apply] Updated: NOTICE`);

// 5. Generate TRADEMARKS.md
const trademarksPath = path.join(ROOT_DIR, 'TRADEMARKS.md');
const trademarksContent = `# Trademark and Brand Policy: Mimic Manager

**Owner:** Wefik  
**Creator:** SK Sahinur Islam  
**Last-reviewed:** 2026-10-29  

---

## 1. Trademarks and Ownership

"Mimic Manager", "MimicManager", the Mimic Manager logo and mark, and "Wefik" are trademarks of Wefik.

The open-source licenses governing the software code (AGPL-3.0 and GPL-2.0+) grant you extensive rights to inspect, run, modify, and redistribute the program source code. However, **they do not grant trademark rights to use the project name or logos** for derived, commercial, or modified distributions in a manner that implies endorsement or affiliation.

---

## 2. Permitted Uses

You MAY:
- Factually refer to your compatibility with Mimic Manager (e.g. "Plugin for Mimic Manager", "Exported from Mimic Manager").
- Distribute unmodified release binaries or source packages retaining original copyright and attribution notices.
- Use the name in non-commercial academic research, security audits, and news articles.

---

## 3. Restricted Uses and Fork Requirements

If you create a modified version, commercial fork, or hosted multi-tenant software-as-a-service based on this repository:
1. You **MUST rename** the product to a distinct, non-confusing name (e.g. via \`pnpm brand:rename "<Your Brand>"\`).
2. You **MUST remove** the official Mimic Manager and Wefik visual logos from user interfaces and marketing materials.
3. You **MUST retain** the underlying copyright notices and license headers crediting Wefik and SK Sahinur Islam in all source files and the \`NOTICE\` file in accordance with AGPL-3.0 and GPL-2.0+.
`;
fs.writeFileSync(trademarksPath, trademarksContent, 'utf-8');
console.log(`[brand:apply] Updated: TRADEMARKS.md`);

console.log('[brand:apply] Brand application finished successfully.');
