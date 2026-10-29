<?php
/*! Mimic Manager | (c) 2026 Wefik | Created by SK Sahinur Islam | GPL-2.0-or-later */

declare(strict_types=1);

namespace Wefik\MimicManager\Tests;

use PHPUnit\Framework\TestCase;
use Wefik\MimicManager\Seo\MetaSync;
use Wefik\MimicManager\Seo\SchemaFilter;

final class SeoTest extends TestCase {
    private MetaSync $metaSync;
    private SchemaFilter $schemaFilter;

    protected function setUp(): void {
        parent::setUp();
        $this->metaSync = new MetaSync();
        $this->schemaFilter = new SchemaFilter();
    }

    public function testMetaSyncMapsYoastMetaKeys(): void {
        $keys = $this->metaSync->getMetaKeys(MetaSync::PROVIDER_YOAST);

        $this->assertSame('_yoast_wpseo_title', $keys['title']);
        $this->assertSame('_yoast_wpseo_metadesc', $keys['description']);
        $this->assertSame('_yoast_wpseo_canonical', $keys['canonical']);
    }

    public function testMetaSyncMapsRankMathMetaKeys(): void {
        $keys = $this->metaSync->getMetaKeys(MetaSync::PROVIDER_RANK_MATH);

        $this->assertSame('rank_math_title', $keys['title']);
        $this->assertSame('rank_math_description', $keys['description']);
        $this->assertSame('rank_math_canonical_url', $keys['canonical']);
    }

    public function testPlanGapFillDoesNotOverwriteExistingMetadataWithoutFlag(): void {
        $existing = [
            '_yoast_wpseo_title' => 'Custom Handcrafted Title',
            '_yoast_wpseo_metadesc' => '', // Empty gap
        ];

        $gaps = [
            'title' => 'Auto Generated Title',
            'description' => 'Auto Generated Meta Description'
        ];

        $plan = $this->metaSync->planGapFill($existing, $gaps, MetaSync::PROVIDER_YOAST, false);

        $this->assertTrue($plan['canApply']);
        $this->assertArrayHasKey('_yoast_wpseo_metadesc', $plan['keysToUpdate']);
        $this->assertArrayNotHasKey('_yoast_wpseo_title', $plan['keysToUpdate']);
        $this->assertSame('Auto Generated Meta Description', $plan['keysToUpdate']['_yoast_wpseo_metadesc']);
    }

    public function testSchemaFilterDetectsExistingArticleEntity(): void {
        $html = <<<'HTML'
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "My Blog"
            },
            {
                "@type": "Article",
                "headline": "Post Title"
            }
        ]
    }
    </script>
</head>
<body><h1>Hello World</h1></body>
</html>
HTML;

        $detected = $this->schemaFilter->detectExistingEntities($html);

        $this->assertTrue($detected['WebSite'] ?? false);
        $this->assertTrue($detected['Article'] ?? false);
        $this->assertFalse($detected['BreadcrumbList'] ?? false);
    }

    public function testSchemaFilterExcludesDuplicateArticleEntity(): void {
        $detected = [
            'WebSite' => true,
            'Article' => true,
        ];

        $proposed = [
            ['@type' => 'Article', 'headline' => 'Duplicate Article'],
            ['@type' => 'BreadcrumbList', 'itemListElement' => []],
        ];

        $filtered = $this->schemaFilter->filterDuplicateEntities($proposed, $detected);

        $this->assertCount(1, $filtered);
        $this->assertSame('BreadcrumbList', $filtered[0]['@type']);
    }
}
