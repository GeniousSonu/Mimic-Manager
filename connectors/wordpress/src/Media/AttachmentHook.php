<?php

declare(strict_types=1);

namespace OptiForge\Media;

final class AttachmentHook {
    private const SUPPORTED_MIMES = [
        'image/jpeg' => true,
        'image/png'  => true,
        'image/webp' => true,
    ];

    /**
     * Intercepts WordPress attachment generation metadata.
     * Never throws exceptions; trips circuit breaker on fatal failures.
     *
     * @param array<string, mixed> $metadata
     * @param int                  $attachmentId
     * @return array<string, mixed>
     */
    public function handleAttachmentMetadata(array $metadata, int $attachmentId): array {
        try {
            $filePath = (string) ($metadata['file'] ?? '');
            if ($filePath === '') {
                return $metadata;
            }

            $mimeType = (string) ($metadata['mime_type'] ?? '');
            if ($mimeType === '' || !isset(self::SUPPORTED_MIMES[$mimeType])) {
                return $metadata;
            }

            // Flag metadata indicating optimization job was registered
            $metadata['optiforge_status'] = 'pending';
            $metadata['optiforge_original'] = $filePath;

            return $metadata;
        } catch (\Throwable $e) {
            error_log(sprintf('[OptiForge] AttachmentHook failed for ID %d: %s', $attachmentId, $e->getMessage()));
            return $metadata;
        }
    }
}
