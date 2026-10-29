<?php

declare(strict_types=1);

namespace OptiForge\FileManager;

use RuntimeException;

/**
 * OptiForge Shadow Backup Manager.
 * 
 * Manages atomic snapshot backups before file writes and provides instant 1-click restore.
 */
class ShadowBackup
{
    private string $backupDir;

    public function __construct(string $backupDir)
    {
        if (!is_dir($backupDir)) {
            if (!@mkdir($backupDir, 0755, true) && !is_dir($backupDir)) {
                throw new RuntimeException("Failed to create backup directory: {$backupDir}");
            }
        }
        $this->backupDir = rtrim(realpath($backupDir) ?: $backupDir, DIRECTORY_SEPARATOR);
    }

    /**
     * Creates an atomic timestamped shadow copy of a file before overwriting.
     */
    public function createBackup(string $filePath): ?string
    {
        if (!file_exists($filePath) || !is_file($filePath)) {
            return null; // Newly created file, no prior backup needed
        }

        $filename = basename($filePath);
        $timestamp = date('Ymd_His');
        $hash = substr(sha1_file($filePath) ?: '000000', 0, 8);
        $backupFilename = "{$timestamp}-{$hash}-{$filename}.bak";
        $backupPath = $this->backupDir . DIRECTORY_SEPARATOR . $backupFilename;

        if (!@copy($filePath, $backupPath)) {
            throw new RuntimeException("Failed to create shadow backup for {$filePath}");
        }

        return $backupPath;
    }

    /**
     * Restores a backup file to its target location.
     */
    public function restoreBackup(string $backupPath, string $targetPath): bool
    {
        if (!file_exists($backupPath) || !is_file($backupPath)) {
            throw new RuntimeException("Backup file does not exist: {$backupPath}");
        }

        return copy($backupPath, $targetPath);
    }

    /**
     * Lists existing shadow backups.
     * 
     * @return array<array{filename: string, path: string, size: int, created_at: int}>
     */
    public function listBackups(): array
    {
        $files = glob($this->backupDir . DIRECTORY_SEPARATOR . '*.bak');
        if ($files === false) {
            return [];
        }

        $result = [];
        foreach ($files as $file) {
            $result[] = [
                'filename' => basename($file),
                'path' => $file,
                'size' => filesize($file) ?: 0,
                'created_at' => filemtime($file) ?: 0,
            ];
        }

        usort($result, fn($a, $b) => $b['created_at'] <=> $a['created_at']);
        return $result;
    }
}
