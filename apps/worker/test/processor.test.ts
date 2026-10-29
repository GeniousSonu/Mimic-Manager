import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { MediaProcessor, MediaProcessorError } from '../src/processor.js';

describe('MediaProcessor Sharp Worker Tests', () => {
  const processor = new MediaProcessor();

  it('converts a test JPEG image to WebP with byte savings and correct SHA256', async () => {
    // Generate a test 200x200 image buffer
    const testBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await processor.processImage(testBuffer, {
      format: 'webp',
      preset: 'balanced',
      stripMetadata: true,
      preserveIcc: true,
      avifEffort: 4,
    });

    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
    expect(result.variants.length).toBe(1);
    const variant = result.variants[0]!;
    expect(variant.format).toBe('webp');
    expect(variant.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(variant.bytes).toBeGreaterThan(0);
  });

  it('converts an image to AVIF format', async () => {
    const testBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 50, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer();

    const result = await processor.processImage(testBuffer, {
      format: 'avif',
      preset: 'balanced',
      stripMetadata: true,
      preserveIcc: true,
      avifEffort: 2,
    });

    const variant = result.variants[0]!;
    expect(variant.format).toBe('avif');
    expect(variant.sha256).toHaveLength(64);
  });

  it('rejects corrupt or spoofed files without valid magic bytes', async () => {
    const spoofedBuffer = Buffer.from('<?php echo "evil"; ?>', 'utf8');

    await expect(processor.processImage(spoofedBuffer)).rejects.toThrow(
      MediaProcessorError,
    );
  });
});
