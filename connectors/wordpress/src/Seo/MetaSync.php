<?php

declare(strict_types=1);

namespace OptiForge\Seo;

final class MetaSync {
    public const PROVIDER_YOAST     = 'yoast';
    public const PROVIDER_RANK_MATH = 'rank_math';
    public const PROVIDER_SEOPRESS  = 'seopress';
    public const PROVIDER_NATIVE    = 'native';

    private const META_MAP = [
        self::PROVIDER_YOAST => [
            'title'       => '_yoast_wpseo_title',
            'description' => '_yoast_wpseo_metadesc',
            'canonical'   => '_yoast_wpseo_canonical',
        ],
        self::PROVIDER_RANK_MATH => [
            'title'       => 'rank_math_title',
            'description' => 'rank_math_description',
            'canonical'   => 'rank_math_canonical_url',
        ],
        self::PROVIDER_SEOPRESS => [
            'title'       => '_seopress_titles_title',
            'description' => '_seopress_titles_desc',
            'canonical'   => '_seopress_titles_canonical',
        ],
        self::PROVIDER_NATIVE => [
            'title'       => '_optiforge_seo_title',
            'description' => '_optiforge_seo_desc',
            'canonical'   => '_optiforge_seo_canonical',
        ],
    ];

    /**
     * Resolves the target post-meta keys based on detected or specified SEO provider.
     *
     * @param string $provider
     * @return array<string, string>
     */
    public function getMetaKeys(string $provider): array {
        return self::META_MAP[$provider] ?? self::META_MAP[self::PROVIDER_NATIVE];
    }

    /**
     * Plans an SEO gap fill without applying, returning previous and proposed states.
     * Strictly avoids overwriting existing metadata unless forceOverwrite is enabled.
     *
     * @param array<string, mixed> $existingMeta
     * @param array<string, string> $gaps
     * @param string                $provider
     * @param bool                  $forceOverwrite
     * @return array{canApply: bool, keysToUpdate: array<string, string>, previousState: array<string, mixed>}
     */
    public function planGapFill(
        array $existingMeta,
        array $gaps,
        string $provider = self::PROVIDER_NATIVE,
        bool $forceOverwrite = false
    ): array {
        $keys = $this->getMetaKeys($provider);
        $keysToUpdate = [];
        $previousState = [];

        foreach ($gaps as $field => $proposedValue) {
            if (!isset($keys[$field])) {
                continue;
            }

            $metaKey = $keys[$field];
            $currentValue = $existingMeta[$metaKey] ?? '';

            // Safe gap-fill: only populate if currently empty, or if overwrite explicitly requested
            if ($currentValue === '' || $forceOverwrite) {
                $keysToUpdate[$metaKey] = $proposedValue;
                $previousState[$metaKey] = $currentValue;
            }
        }

        return [
            'canApply'      => count($keysToUpdate) > 0,
            'keysToUpdate'  => $keysToUpdate,
            'previousState' => $previousState,
        ];
    }
}
