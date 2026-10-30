<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Seo;

final class SchemaFilter {
    /**
     * Inspects HTML for existing Schema.org JSON-LD scripts and detects present @type entities.
     *
     * @param string $html
     * @return array<string, bool> Map of detected entity types (e.g. ['Article' => true])
     */
    public function detectExistingEntities(string $html): array {
        if ($html === '' || stripos($html, 'application/ld+json') === false) {
            return [];
        }

        $detected = [];
        $pattern = '/<script\s+[^>]*?type=["\']application\/ld\+json["\'][^>]*?>(.*?)<\/script>/is';

        if (preg_match_all($pattern, $html, $matches)) {
            foreach ($matches[1] as $jsonBlock) {
                try {
                    $data = json_decode(trim($jsonBlock), true);
                    if (!is_array($data)) {
                        continue;
                    }

                    $this->extractTypes($data, $detected);
                } catch (\Throwable $e) {
                    // Ignore malformed third-party JSON-LD
                }
            }
        }

        return $detected;
    }

    /**
     * Filters proposed schema entities to emit only those not already declared by Yoast/Rank Math.
     *
     * @param array<int, array<string, mixed>> $proposedEntities
     * @param array<string, bool>             $existingEntities
     * @return array<int, array<string, mixed>>
     */
    public function filterDuplicateEntities(array $proposedEntities, array $existingEntities): array {
        $filtered = [];

        foreach ($proposedEntities as $entity) {
            $type = (string) ($entity['@type'] ?? '');
            if ($type !== '' && isset($existingEntities[$type])) {
                // Skip entity: already declared by active SEO plugin
                continue;
            }
            $filtered[] = $entity;
        }

        return $filtered;
    }

    /**
     * Recursively extracts @type properties from decoded schema graph.
     *
     * @param array<string, mixed> $node
     * @param array<string, bool>  $detected
     */
    private function extractTypes(array $node, array &$detected): void {
        if (isset($node['@type'])) {
            $type = (string) $node['@type'];
            $detected[$type] = true;
        }

        if (isset($node['@graph']) && is_array($node['@graph'])) {
            foreach ($node['@graph'] as $child) {
                if (is_array($child)) {
                    $this->extractTypes($child, $detected);
                }
            }
        }
    }
}
