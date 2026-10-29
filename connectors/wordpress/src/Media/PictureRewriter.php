<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Media;

final class PictureRewriter {
    /**
     * Rewrites standard <img> tags in rendered HTML into <picture> containers
     * with AVIF and WebP sources.
     *
     * @param string $html
     * @return string
     */
    public function rewriteContent(string $html): string {
        try {
            if ($html === '' || stripos($html, '<img') === false) {
                return $html;
            }

            // Regex matches <img> tags with src ending in jpg, jpeg, or png
            $pattern = '/<img\s+([^>]*?)src=["\']([^"\']+\.(jpe?g|png))["\']([^>]*?)\/?>/i';

            return (string) preg_replace_callback($pattern, function (array $matches): string {
                $beforeSrc = $matches[1];
                $src       = $matches[2];
                $ext       = $matches[3];
                $afterSrc  = $matches[4];

                $avifSrc = preg_replace('/\.' . preg_quote($ext, '/') . '$/i', '.avif', $src);
                $webpSrc = preg_replace('/\.' . preg_quote($ext, '/') . '$/i', '.webp', $src);

                return sprintf(
                    '<picture>' .
                    '<source srcset="%s" type="image/avif">' .
                    '<source srcset="%s" type="image/webp">' .
                    '<img %ssrc="%s"%s loading="lazy" decoding="async"/>' .
                    '</picture>',
                    htmlspecialchars((string) $avifSrc, ENT_QUOTES, 'UTF-8'),
                    htmlspecialchars((string) $webpSrc, ENT_QUOTES, 'UTF-8'),
                    $beforeSrc,
                    htmlspecialchars($src, ENT_QUOTES, 'UTF-8'),
                    $afterSrc
                );
            }, $html);
        } catch (\Throwable $e) {
            error_log('[Mimic Manager] PictureRewriter failed: ' . $e->getMessage());
            return $html;
        }
    }
}
