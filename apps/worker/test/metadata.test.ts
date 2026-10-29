import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { AiMetadataService, HeuristicMetadataProvider } from '../src/metadata.js';

describe('AI Vision & Metadata Fallback Tests', () => {
  it('heuristic provider extracts normalized filename and post context', async () => {
    const provider = new HeuristicMetadataProvider();
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 50, g: 100, b: 200 }
      }
    })
      .jpeg()
      .toBuffer();

    const result = await provider.generate(testImage, {
      filename: 'handcrafted-ceramic-mug-blue.jpg',
      postTitle: 'Modern Kitchenware'
    });

    expect(result.provider).toBe('heuristic');
    expect(result.altText).toContain('Handcrafted ceramic mug blue');
    expect(result.altText).toContain('Modern Kitchenware');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('AiMetadataService seamlessly falls back to heuristic when AI services are offline', async () => {
    // Point to non-existent port to guarantee network rejection
    const service = new AiMetadataService(
      'http://127.0.0.1:54321',
      'nonexistent-model',
      'http://127.0.0.1:54321',
      'dummy-key'
    );
    const testImage = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .png()
      .toBuffer();

    const result = await service.generateAltText(testImage, {
      filename: 'hero-summer-collection.png',
      postTitle: 'Summer Fashion 2026'
    });

    expect(result.provider).toBe('heuristic');
    expect(result.altText).toContain('Hero summer collection');
    expect(result.source).toBe('context_heuristic');
  });
});
