<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\FileManager;

use InvalidArgumentException;
use RuntimeException;

/**
 * Mimic Manager Sandboxed Jail Guard.
 * 
 * Enforces strict filesystem containment within wp-content/, protects against
 * path traversal, symlink escapes, and denies access to sensitive configuration files.
 */
class JailGuard
{
    private string $jailRoot;

    /**
     * @var string[]
     */
    private array $sensitiveFiles = [
        'wp-config.php',
        '.htaccess',
        '.env',
        '.user.ini',
        '.htpasswd',
        'web.config',
    ];

    /**
     * @var string[]
     */
    private array $sensitiveExtensions = [
        'sql',
        'dump',
        'key',
        'pem',
        'crt',
        'db',
        'sqlite',
        'tar',
        'gz',
        '7z',
    ];

    public function __construct(string $jailRoot)
    {
        $realRoot = realpath($jailRoot);
        if ($realRoot === false || !is_dir($realRoot)) {
            throw new InvalidArgumentException("Jail root directory does not exist: {$jailRoot}");
        }
        $this->jailRoot = rtrim($realRoot, DIRECTORY_SEPARATOR);
    }

    public function getJailRoot(): string
    {
        return $this->jailRoot;
    }

    /**
     * Validates and canonicalizes a relative or target path.
     * Throws SecurityException if the path attempts to escape the jail or access restricted targets.
     */
    public function resolveSecurePath(string $relativePath): string
    {
        // 1. Detect null bytes
        if (str_contains($relativePath, "\0") || str_contains($relativePath, '%00')) {
            throw new RuntimeException('Null byte injection detected in path');
        }

        // 2. Decode URL-encoded or double-encoded traversal attempts
        $decoded = urldecode($relativePath);
        while ($decoded !== $relativePath) {
            $relativePath = $decoded;
            $decoded = urldecode($relativePath);
        }

        // 3. Raw traversal string check
        if (str_contains($relativePath, '..') || str_contains($relativePath, '\\')) {
            // Normalize path separators
            $normalized = str_replace('\\', '/', $relativePath);
            if (preg_match('#(?:^|/)\.\.(?:/|$)#', $normalized)) {
                throw new RuntimeException('Directory traversal (..) detected in path');
            }
        }

        // 4. Clean leading slashes
        $cleanRelative = ltrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath), DIRECTORY_SEPARATOR);
        $fullPath = $this->jailRoot . DIRECTORY_SEPARATOR . $cleanRelative;

        // 5. If target file/dir already exists, check realpath
        if (file_exists($fullPath)) {
            $realPath = realpath($fullPath);
            if ($realPath === false) {
                throw new RuntimeException('Unable to resolve realpath for target');
            }

            // Realpath MUST start with jailRoot
            if (!str_starts_with($realPath, $this->jailRoot)) {
                throw new RuntimeException("Path escapes jail root ({$this->jailRoot}): {$realPath}");
            }

            // Symlink escape check
            if (is_link($fullPath)) {
                $target = readlink($fullPath);
                $realTarget = realpath($target !== false ? $target : $fullPath);
                if ($realTarget === false || !str_starts_with($realTarget, $this->jailRoot)) {
                    throw new RuntimeException('Symlink target points outside the sandboxed jail');
                }
            }

            $this->assertNotSensitive(basename($realPath));
            return $realPath;
        }

        // 6. If target file is being newly created, check parent directory containment
        $parentDir = dirname($fullPath);
        $realParent = realpath($parentDir);
        if ($realParent === false || !str_starts_with($realParent, $this->jailRoot)) {
            throw new RuntimeException('Parent directory does not exist or escapes jail');
        }

        $filename = basename($fullPath);
        $this->assertNotSensitive($filename);

        return $realParent . DIRECTORY_SEPARATOR . $filename;
    }

    /**
     * Checks if a filename is on the sensitive blacklist.
     */
    public function assertNotSensitive(string $filename): void
    {
        // Strip alternate data streams (e.g. file.php::$DATA or file.php:stream)
        if (str_contains($filename, ':')) {
            $filename = explode(':', $filename)[0];
        }

        // Strip trailing dots and whitespace
        $normalizedFilename = rtrim($filename, ". \t\n\r\0\x0B");
        $lower = strtolower($normalizedFilename);

        // Exact match
        if (in_array($lower, $this->sensitiveFiles, true)) {
            throw new RuntimeException("Access denied: {$filename} is a protected sensitive file");
        }

        // Hidden / dot files
        if (str_starts_with($lower, '.')) {
            throw new RuntimeException("Access denied: hidden dotfiles cannot be accessed");
        }

        // Extension check
        $ext = pathinfo($lower, PATHINFO_EXTENSION);
        if (in_array($ext, $this->sensitiveExtensions, true)) {
            throw new RuntimeException("Access denied: extension .{$ext} is restricted");
        }
    }
}
