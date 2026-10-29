import sharp from 'sharp';

export interface ImageMetadataContext {
  filename: string;
  postTitle?: string;
  surroundingText?: string;
  language?: string;
}

export interface AltTextGenerationResult {
  altText: string;
  confidence: number;
  provider: 'ollama' | 'heuristic' | 'byok';
  source: 'vision_model' | 'exif_caption' | 'context_heuristic';
}

export class HeuristicMetadataProvider {
  public async generate(
    imageBuffer: Buffer,
    context: ImageMetadataContext
  ): Promise<AltTextGenerationResult> {
    try {
      const metadata = await sharp(imageBuffer).metadata();

      // 1. Check EXIF ImageDescription / IPTC Headline
      if (metadata.exif) {
        // EXIF description check if present
      }

      // 2. Normalization of clean filename
      const cleanName = context.filename
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b(img|dsc|image|photo|pic|screenshot)\b/gi, '')
        .trim();

      if (cleanName.length > 3) {
        const alt = context.postTitle
          ? `${cleanName} for ${context.postTitle}`
          : cleanName;
        return {
          altText: alt.charAt(0).toUpperCase() + alt.slice(1),
          confidence: 0.75,
          provider: 'heuristic',
          source: 'context_heuristic'
        };
      }
    } catch {
      // Fallback to post context
    }

    const fallback = context.postTitle ? `Illustration for ${context.postTitle}` : 'Site media illustration';
    return {
      altText: fallback,
      confidence: 0.5,
      provider: 'heuristic',
      source: 'context_heuristic'
    };
  }
}

export class OllamaVisionProvider {
  constructor(
    private readonly baseUrl: string = 'http://localhost:11434',
    private readonly model: string = 'llama3.2-vision'
  ) {}

  public async generate(
    imageBuffer: Buffer,
    context: ImageMetadataContext
  ): Promise<AltTextGenerationResult> {
    const base64 = imageBuffer.toString('base64');
    const prompt = `Generate a concise, accessible alt-text description (1-2 sentences) for this image. Context: ${context.filename} ${context.postTitle || ''}. Return ONLY the description text without any prefixes.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          images: [base64],
          stream: false
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = (await res.json()) as { response?: string };
      const description = (data.response || '').trim();

      if (description) {
        return {
          altText: description,
          confidence: 0.92,
          provider: 'ollama',
          source: 'vision_model'
        };
      }
      throw new Error('Empty response from Ollama');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class GoogleAiStudioProvider {
  constructor(
    private readonly baseUrl: string = process.env.OPENAI_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/openai',
    private readonly apiKey: string = process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      '',
    private readonly model: string = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  ) {}

  public async generate(
    imageBuffer: Buffer,
    context: ImageMetadataContext
  ): Promise<AltTextGenerationResult> {
    const prompt = `Generate a concise, accessible alt-text description (1-2 sentences) for an image. Context: Filename "${context.filename}", Post "${context.postTitle || 'Blog Post'}", Surrounding text: "${context.surroundingText || 'None'}". Return ONLY the alt-text string.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Google AI Studio returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = (data.choices?.[0]?.message?.content || '').trim();

      if (text) {
        return {
          altText: text,
          confidence: 0.95,
          provider: 'byok',
          source: 'vision_model'
        };
      }
      throw new Error('Empty response from Google AI Studio');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class AiMetadataService {
  private readonly googleAi: GoogleAiStudioProvider;
  private readonly ollama: OllamaVisionProvider;
  private readonly heuristic: HeuristicMetadataProvider;

  constructor(
    ollamaUrl?: string,
    ollamaModel?: string,
    googleAiUrl?: string,
    googleAiKey?: string
  ) {
    this.googleAi = new GoogleAiStudioProvider(googleAiUrl, googleAiKey);
    this.ollama = new OllamaVisionProvider(ollamaUrl, ollamaModel);
    this.heuristic = new HeuristicMetadataProvider();
  }

  public async generateAltText(
    imageBuffer: Buffer,
    context: ImageMetadataContext
  ): Promise<AltTextGenerationResult> {
    // 1. Try Google AI Studio via OpenAI-compatible endpoint
    try {
      return await this.googleAi.generate(imageBuffer, context);
    } catch {
      // 2. Try Ollama local vision model if available
      try {
        return await this.ollama.generate(imageBuffer, context);
      } catch {
        // 3. Seamlessly fall back to rule-based heuristic provider
        return await this.heuristic.generate(imageBuffer, context);
      }
    }
  }
}
