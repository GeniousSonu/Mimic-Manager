import crypto from 'node:crypto';
import { HmacHeaders, type HmacVerificationResult } from './hmac.js';

export interface CreateSignatureParams {
  secret: string;
  method: string;
  path: string;
  body: string | Buffer;
  timestamp?: number;
  nonce?: string;
}

export interface VerifySignatureParams {
  secret: string;
  method: string;
  path: string;
  body: string | Buffer;
  headers: Record<string, string | string[] | undefined>;
  maxSkewSeconds?: number;
}

export class HmacSigner {
  public static readonly DEFAULT_MAX_SKEW_SECONDS = 300; // 5 minutes

  public static hashBody(body: string | Buffer): string {
    const buf = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
    return crypto.createHash('sha256').update(buf).digest('hex');
  }

  public static buildCanonicalString(
    method: string,
    path: string,
    bodySha256: string,
    timestamp: number,
    nonce: string,
  ): string {
    return `${method.toUpperCase()}\n${path}\n${bodySha256}\n${timestamp}\n${nonce}`;
  }

  public static computeSignature(secret: string, canonicalString: string): string {
    return crypto.createHmac('sha256', secret).update(Buffer.from(canonicalString, 'utf8')).digest('hex');
  }

  public static sign(params: CreateSignatureParams): {
    signature: string;
    timestamp: number;
    nonce: string;
    bodySha256: string;
    canonicalString: string;
    headers: Record<string, string>;
  } {
    const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
    const nonce = params.nonce ?? crypto.randomBytes(16).toString('hex');
    const bodySha256 = this.hashBody(params.body);
    const canonicalString = this.buildCanonicalString(params.method, params.path, bodySha256, timestamp, nonce);
    const signature = this.computeSignature(params.secret, canonicalString);

    return {
      signature,
      timestamp,
      nonce,
      bodySha256,
      canonicalString,
      headers: {
        [HmacHeaders.TIMESTAMP]: timestamp.toString(),
        [HmacHeaders.NONCE]: nonce,
        [HmacHeaders.SIGNATURE]: signature,
      },
    };
  }

  public static verify(params: VerifySignatureParams): HmacVerificationResult {
    const getHeader = (name: string): string | undefined => {
      const val = params.headers[name] ?? params.headers[name.toLowerCase()];
      if (Array.isArray(val)) return val[0];
      return val;
    };

    const signature = getHeader(HmacHeaders.SIGNATURE);
    const timestampStr = getHeader(HmacHeaders.TIMESTAMP);
    const nonce = getHeader(HmacHeaders.NONCE);

    if (!signature || !timestampStr || !nonce) {
      return {
        valid: false,
        code: 'AUTH_MISSING_HEADERS',
        message: 'Missing required HMAC signature headers',
      };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (Number.isNaN(timestamp)) {
      return {
        valid: false,
        code: 'AUTH_INVALID_TIMESTAMP',
        message: 'Invalid timestamp header format',
      };
    }

    const maxSkew = params.maxSkewSeconds ?? this.DEFAULT_MAX_SKEW_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxSkew) {
      return {
        valid: false,
        code: 'AUTH_TIMESTAMP_SKEW',
        message: `Timestamp skew exceeds ${maxSkew} seconds (server: ${now}, req: ${timestamp})`,
      };
    }

    const bodySha256 = this.hashBody(params.body);
    const canonicalString = this.buildCanonicalString(params.method, params.path, bodySha256, timestamp, nonce);
    const expectedSignature = this.computeSignature(params.secret, canonicalString);

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return {
        valid: false,
        code: 'AUTH_INVALID_SIGNATURE',
        message: 'HMAC signature verification failed',
      };
    }

    return { valid: true };
  }
}
