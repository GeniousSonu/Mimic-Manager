import sharp from 'sharp';
import crypto from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import {
  OptimizeImageOptions,
  MediaJobResult,
  ImageVariantResult,
  HmacSigner,
  HmacHeaders,
  WebhookPayload,
} from '@mimic-manager/types';
import { SsrfGuard } from '@mimic-manager/ssrf-guard';

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_INPUT_PIXELS = 268402689; // 16384 x 16384 max

export class MediaProcessorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MediaProcessorError';
  }
}

export class MediaProcessor {
  private readonly ssrfGuard = new SsrfGuard();

  public async processImage(
    inputBuffer: Buffer,
    options: OptimizeImageOptions = {
      format: 'webp',
      preset: 'balanced',
      stripMetadata: true,
      preserveIcc: true,
      avifEffort: 4,
    },
  ): Promise<MediaJobResult> {
    if (inputBuffer.length > MAX_IMAGE_BYTES) {
      throw new MediaProcessorError(
        `File size (${inputBuffer.length} bytes) exceeds limit of ${MAX_IMAGE_BYTES} bytes`,
        'MEDIA_SIZE_LIMIT_EXCEEDED',
      );
    }

    // Inspect magic bytes
    const detectedType = await fileTypeFromBuffer(inputBuffer);
    if (!detectedType) {
      // Check if it is SVG text
      const head = inputBuffer.slice(0, 512).toString('utf8').trim().toLowerCase();
      if (!head.includes('<svg') && !head.includes('<?xml')) {
        throw new MediaProcessorError('Unrecognized or invalid image magic bytes', 'MEDIA_INVALID_FORMAT');
      }
    }

    const originalSha256 = crypto.createHash('sha256').update(inputBuffer).digest('hex');
    const originalBytes = inputBuffer.length;

    let pipeline = sharp(inputBuffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOnError: false,
    });

    const metadata = await pipeline.metadata().catch((err) => {
      throw new MediaProcessorError(`Failed to decode image metadata: ${(err as Error).message}`, 'MEDIA_CORRUPT_FILE');
    });

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width * height > MAX_INPUT_PIXELS) {
      throw new MediaProcessorError('Image dimensions exceed safety limit (decompression bomb)', 'MEDIA_DECOMPRESSION_BOMB');
    }

    // Configure resize if requested
    if (options.maxWidth || options.maxHeight) {
      pipeline = pipeline.resize({
        width: options.maxWidth,
        height: options.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Configure metadata & color profile
    if (options.stripMetadata) {
      if (options.preserveIcc && metadata.hasProfile) {
        pipeline = pipeline.withMetadata();
      }
    }

    // Format & Quality configuration
    const targetFormat = options.format || 'webp';
    let outputBuffer: Buffer;

    if (targetFormat === 'webp') {
      const quality = options.quality ?? (options.preset === 'aggressive' ? 70 : options.preset === 'high' ? 85 : 78);
      pipeline = pipeline.webp({
        quality,
        effort: 4,
      });
      outputBuffer = await pipeline.toBuffer();
    } else if (targetFormat === 'avif') {
      const quality = options.quality ?? (options.preset === 'aggressive' ? 60 : options.preset === 'high' ? 80 : 70);
      pipeline = pipeline.avif({
        quality,
        effort: options.avifEffort ?? 4,
      });
      outputBuffer = await pipeline.toBuffer();
    } else if (targetFormat === 'jpeg') {
      const quality = options.quality ?? 80;
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      outputBuffer = await pipeline.toBuffer();
    } else {
      pipeline = pipeline.png({ compressionLevel: 8 });
      outputBuffer = await pipeline.toBuffer();
    }

    const outputSha256 = crypto.createHash('sha256').update(outputBuffer).digest('hex');
    const outputBytes = outputBuffer.length;

    const savedBytes = Math.max(0, originalBytes - outputBytes);
    const savedPercentage = originalBytes > 0 ? Number(((savedBytes / originalBytes) * 100).toFixed(2)) : 0;
    const isOptimal = outputBytes >= originalBytes;

    const variant: ImageVariantResult = {
      format: targetFormat,
      quality: options.quality ?? 80,
      bytes: outputBytes,
      width,
      height,
      sha256: outputSha256,
      savedBytes,
      savedPercentage,
      storageKey: `variants/${outputSha256}.${targetFormat}`,
    };

    return {
      originalSha256,
      originalBytes,
      width,
      height,
      format: metadata.format || 'unknown',
      variants: [variant],
      isOptimal,
    };
  }

  /**
   * Dispatches an HMAC-signed webhook delivery to the connector
   */
  public async dispatchWebhook(
    webhookUrl: string,
    secret: string,
    siteId: string,
    payload: WebhookPayload,
  ): Promise<Response> {
    const rawBody = JSON.stringify(payload);
    const urlObj = new URL(webhookUrl);
    const path = urlObj.pathname + urlObj.search;

    const signed = HmacSigner.sign({
      secret,
      method: 'POST',
      path,
      body: rawBody,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [HmacHeaders.SITE_ID]: siteId,
      ...signed.headers,
    };

    return this.ssrfGuard.safeFetch(webhookUrl, {
      method: 'POST',
      headers,
      body: rawBody,
    });
  }
}
