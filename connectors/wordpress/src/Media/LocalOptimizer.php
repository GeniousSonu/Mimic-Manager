<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Media;

final class LocalOptimizer
{
    private const QUALITY = 82;

    /**
     * Checks if the server environment supports local WebP conversion.
     *
     * @return array{supported: bool, engine: string}
     */
    public static function getEngineStatus(): array
    {
        if (extension_loaded('imagick') && class_exists('\Imagick')) {
            $im = new \Imagick();
            if (in_array('WEBP', $im->queryFormats('WEBP'), true)) {
                return ['supported' => true, 'engine' => 'imagick'];
            }
        }

        if (extension_loaded('gd') && function_exists('imagewebp')) {
            return ['supported' => true, 'engine' => 'gd'];
        }

        return ['supported' => false, 'engine' => 'none'];
    }

    /**
     * Optimizes an image locally to WebP format.
     * Originals are preserved and never deleted automatically.
     *
     * @param string $sourcePath Absolute filesystem path to source JPEG/PNG
     * @return array{success: bool, originalSize: int, optimizedSize: int, savingsBytes: int, savingsPercent: float, webpPath: string, error?: string}
     */
    public function optimizeLocally(string $sourcePath): array
    {
        if (!file_exists($sourcePath) || !is_readable($sourcePath)) {
            return [
                'success' => false,
                'originalSize' => 0,
                'optimizedSize' => 0,
                'savingsBytes' => 0,
                'savingsPercent' => 0.0,
                'webpPath' => '',
                'error' => 'Source file does not exist or is not readable.',
            ];
        }

        $originalSize = (int) filesize($sourcePath);
        $status = self::getEngineStatus();
        if (!$status['supported']) {
            return [
                'success' => false,
                'originalSize' => $originalSize,
                'optimizedSize' => $originalSize,
                'savingsBytes' => 0,
                'savingsPercent' => 0.0,
                'webpPath' => '',
                'error' => 'No local image processing library (Imagick or GD with WebP support) found.',
            ];
        }

        $webpPath = preg_replace('/\.(jpe?g|png)$/i', '.webp', $sourcePath);
        if ($webpPath === null || $webpPath === $sourcePath) {
            $webpPath = $sourcePath . '.webp';
        }

        try {
            if ($status['engine'] === 'imagick') {
                $im = new \Imagick($sourcePath);
                $im->setImageFormat('webp');
                $im->setImageCompressionQuality(self::QUALITY);
                $im->stripImage();
                $im->writeImage($webpPath);
                $im->clear();
                $im->destroy();
            } else {
                $info = getimagesize($sourcePath);
                if (!$info) {
                    throw new \RuntimeException('Unable to read image dimensions');
                }
                $mime = $info['mime'] ?? '';
                if ($mime === 'image/jpeg') {
                    $img = imagecreatefromjpeg($sourcePath);
                } elseif ($mime === 'image/png') {
                    $img = imagecreatefrompng($sourcePath);
                    if ($img) {
                        imagepalettetotruecolor($img);
                        imagealphablending($img, true);
                        imagesavealpha($img, true);
                    }
                } else {
                    throw new \RuntimeException("Unsupported mime type: {$mime}");
                }

                if (!$img) {
                    throw new \RuntimeException('Failed to create GD image resource.');
                }

                imagewebp($img, $webpPath, self::QUALITY);
                imagedestroy($img);
            }

            if (!file_exists($webpPath)) {
                throw new \RuntimeException('Optimized WebP file was not created.');
            }

            $optimizedSize = (int) filesize($webpPath);
            $savingsBytes = max(0, $originalSize - $optimizedSize);
            $savingsPercent = $originalSize > 0 ? round(($savingsBytes / $originalSize) * 100, 1) : 0.0;

            return [
                'success' => true,
                'originalSize' => $originalSize,
                'optimizedSize' => $optimizedSize,
                'savingsBytes' => $savingsBytes,
                'savingsPercent' => $savingsPercent,
                'webpPath' => $webpPath,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'originalSize' => $originalSize,
                'optimizedSize' => $originalSize,
                'savingsBytes' => 0,
                'savingsPercent' => 0.0,
                'webpPath' => '',
                'error' => $e->getMessage(),
            ];
        }
    }
}
