=== Mimic Manager ===
Contributors: wefik, genioussonu
Donate link: https://www.wefik.in
Tags: performance, optimization, images, webp, speed
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.0.0-rc.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free and secure platform for image optimization, PageSpeed and Core Web Vitals fixes, SEO gap fill, and sandboxed file management.

== Description ==

Mimic Manager is an open-source, data-private site optimization platform. It gives site owners, developers, and agencies complete control over media compression, Core Web Vitals fixes, and SEO gap-filling with 100% local operation and zero forced external dependencies.

Unlike legacy optimization plugins, Mimic Manager contains zero paywalls, zero "Pro" nags, zero trialware, and zero tracking scripts. Everything works immediately and natively on your server.

= Key Features =

* **Local WebP Image Optimization:** Automatically converts JPEG and PNG uploads to lightweight WebP using native server extensions (Imagick or GD). Original files are permanently preserved and never deleted.
* **Tiered Core Web Vitals Fixes:** Safe, toggleable fixes for Cumulative Layout Shift (CLS) and Largest Contentful Paint (LCP) including image dimensions, native lazy-loading with LCP exclusion, and async decoding.
* **Plugin-Aware SEO Gap Fill:** Seamlessly detects active SEO plugins (Yoast, Rank Math, SEOPress, AIOSEO) and writes into their schema fields without overwriting user-authored titles or descriptions.
* **Sandboxed File Manager:** Strictly jailed to `wp-content/` with path canonicalization, pre-save PHP AST syntax checking to prevent WSOD, and instant shadow backups.
* **Optional Cloud Offload:** Offload high-volume batch processing to your own private self-hosted Mimic Manager API with cryptographically signed HMAC requests.

== External Services ==

By default, Mimic Manager operates **100% locally** and makes **ZERO outbound network requests**.

If you optionally choose to connect your own self-hosted Mimic Manager backend API instance (e.g. running on Docker or Render), the plugin will transmit optimization requests to your designated server:
* **Service:** Self-Hosted Mimic Manager API (https://github.com/GeniousSonu/Mimic-Manager).
* **Data Transmitted:** Media binary buffers and attachment dimensions for background batch conversion.
* **When Transmitted:** Strictly upon manual pairing by an administrator and when batch offload is initiated.
* **Terms of Service & Privacy:** Managed under your own self-hosted infrastructure policy. Project information available at https://www.wefik.in

== Installation ==

1. Upload the `mimic-manager` folder to the `/wp-content/plugins/` directory, or upload the zip directly via **Plugins > Add New > Upload Plugin**.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Navigate to **Mimic Manager** in your admin menu to review local engine status and configure optimization settings.

== Frequently Asked Questions ==

= Does this plugin work without creating an account or paying fees? =
Yes. Mimic Manager is 100% free software under the GPL-2.0-or-later license. All image compression, speed fixes, and SEO tools run locally on your server out-of-the-box.

= Are original image files deleted? =
No. Mimic Manager permanently preserves your original JPEG/PNG media. You can restore originals with a single click at any time.

= Does the file manager allow editing core WordPress files? =
No. For security, the file manager is strictly jailed to `wp-content/` and explicitly blocks access to sensitive configuration files like `wp-config.php`, `.env`, and `.htaccess`.

== Screenshots ==

1. Dashboard showing local image optimization engine and zero-telemetry status.
2. Media Library showing native WebP conversion savings and original file preservation.
3. Core Web Vitals fixes: image dimensions, native lazy loading, async decoding.
4. SEO gap-fill detection and metadata synchronization.
5. Sandboxed visual file manager jailed to wp-content.

== Changelog ==

= 1.0.0-rc.1 =
* Official production release candidate.
* Native local WebP conversion via Imagick and GD.
* Jailed file manager with pre-save PHP AST syntax check.
* Integration with Yoast and Rank Math SEO plugins.
* Zero outbound requests before explicit administrator consent.

== Upgrade Notice ==

= 1.0.0-rc.1 =
Initial production release of Mimic Manager.
