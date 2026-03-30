import sharp from "sharp";
import type { OgMetadata } from "./ogFetcher";

const THUMB_WIDTH = 1200;
const THUMB_HEIGHT = 630;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Strategy interface for generating composite thumbnail images.
 * Each strategy handles a specific source type.
 */
export interface ThumbnailGeneratorStrategy {
  supports(sourceType: string): boolean;
  generate(ogMetadata: OgMetadata): Promise<Buffer | null>;
}

/**
 * Escape special XML characters for safe embedding in SVG text elements.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncate text to fit a max character count, appending ellipsis if needed.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "\u2026";
}

/**
 * Generates a composite article thumbnail from OG metadata.
 *
 * Layout:
 * - Background: dark gradient
 * - Left side: og:image (cropped to fill, with rounded corners)
 * - Right side: title (large), author/site name (small), subtle branding
 *
 * If no og:image is available, renders a text-only card.
 */
export class ArticleThumbnailStrategy implements ThumbnailGeneratorStrategy {
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options?: { fetchFn?: typeof fetch; timeoutMs?: number }) {
    this.fetchFn = options?.fetchFn ?? fetch;
    this.timeoutMs = options?.timeoutMs ?? FETCH_TIMEOUT_MS;
  }

  supports(sourceType: string): boolean {
    return sourceType === "article";
  }

  async generate(ogMetadata: OgMetadata): Promise<Buffer | null> {
    try {
      const title = ogMetadata.title ?? "Untitled Article";
      const author = ogMetadata.author ?? null;
      const siteName = ogMetadata.siteName ?? null;
      const imageUrl = ogMetadata.image ?? null;

      // Build subtitle line from author + site name
      const subtitleParts: string[] = [];
      if (author) subtitleParts.push(author);
      if (siteName && siteName !== author) subtitleParts.push(siteName);
      const subtitle = subtitleParts.join(" \u00B7 "); // middle dot separator

      // Try to fetch the og:image
      let imageBuffer: Buffer | null = null;
      if (imageUrl) {
        imageBuffer = await this.fetchImage(imageUrl);
      }

      if (imageBuffer) {
        return await this.compositeWithImage(imageBuffer, title, subtitle);
      }
      return await this.compositeTextOnly(title, subtitle);
    } catch {
      return null;
    }
  }

  /**
   * Fetch an image URL and return it as a Buffer.
   */
  private async fetchImage(url: string): Promise<Buffer | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { "User-Agent": "BrainFeedBot/1.0" },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) return null;

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  /**
   * Composite layout with og:image on the left and text on the right.
   *
   * Image takes ~40% width, text takes ~55% on the right.
   */
  private async compositeWithImage(
    imageBuffer: Buffer,
    title: string,
    subtitle: string,
  ): Promise<Buffer> {
    const imgWidth = Math.round(THUMB_WIDTH * 0.4);
    const imgHeight = THUMB_HEIGHT;
    const textAreaX = imgWidth + 40;
    const textAreaWidth = THUMB_WIDTH - textAreaX - 40;

    // Resize and crop the og:image to fill the left panel
    const processedImage = await sharp(imageBuffer)
      .resize(imgWidth, imgHeight, { fit: "cover", position: "center" })
      .png()
      .toBuffer();

    // Build the SVG overlay with text on the right side
    const svgOverlay = this.buildTextOverlaySvg(
      textAreaX,
      textAreaWidth,
      title,
      subtitle,
    );

    return sharp({
      create: {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        channels: 4,
        background: { r: 18, g: 18, b: 24, alpha: 255 },
      },
    })
      .composite([
        // Left panel: og:image
        { input: processedImage, left: 0, top: 0 },
        // Gradient overlay on the image edge for smooth blending
        { input: this.buildEdgeGradientPng(), left: imgWidth - 60, top: 0 },
        // Text overlay
        { input: Buffer.from(svgOverlay), left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
  }

  /**
   * Text-only layout when no og:image is available.
   * Centered text on a gradient background.
   */
  private async compositeTextOnly(
    title: string,
    subtitle: string,
  ): Promise<Buffer> {
    const padding = 80;
    const textWidth = THUMB_WIDTH - padding * 2;

    const svgOverlay = this.buildCenteredTextSvg(textWidth, padding, title, subtitle);

    return sharp({
      create: {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        channels: 4,
        background: { r: 18, g: 18, b: 24, alpha: 255 },
      },
    })
      .composite([
        { input: Buffer.from(svgOverlay), left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
  }

  /**
   * Build an SVG for the right-side text overlay (used in image+text layout).
   */
  private buildTextOverlaySvg(
    textX: number,
    textWidth: number,
    title: string,
    subtitle: string,
  ): string {
    const safeTitle = escapeXml(truncate(title, 100));
    const safeSubtitle = subtitle ? escapeXml(truncate(subtitle, 60)) : "";

    // Wrap title into lines (~35 chars per line for the available width)
    const titleLines = this.wrapText(safeTitle, 35);
    const titleFontSize = titleLines.length > 3 ? 32 : 38;
    const lineHeight = titleFontSize + 8;

    // Position title vertically centered
    const totalTitleHeight = titleLines.length * lineHeight;
    const subtitleHeight = safeSubtitle ? 50 : 0;
    const totalContentHeight = totalTitleHeight + subtitleHeight;
    const startY = Math.round((THUMB_HEIGHT - totalContentHeight) / 2) + titleFontSize;

    const titleSvg = titleLines
      .map((line, i) =>
        `<text x="${textX}" y="${startY + i * lineHeight}" font-family="system-ui, -apple-system, sans-serif" font-size="${titleFontSize}" font-weight="700" fill="#F0F0F5">${line}</text>`
      )
      .join("\n    ");

    const subtitleSvg = safeSubtitle
      ? `<text x="${textX}" y="${startY + totalTitleHeight + 20}" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#8B8B9E">${safeSubtitle}</text>`
      : "";

    return `<svg width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${titleSvg}
    ${subtitleSvg}
  </svg>`;
  }

  /**
   * Build an SVG for centered text layout (used when no image).
   */
  private buildCenteredTextSvg(
    textWidth: number,
    padding: number,
    title: string,
    subtitle: string,
  ): string {
    const safeTitle = escapeXml(truncate(title, 120));
    const safeSubtitle = subtitle ? escapeXml(truncate(subtitle, 80)) : "";

    const titleLines = this.wrapText(safeTitle, 45);
    const titleFontSize = titleLines.length > 3 ? 36 : 44;
    const lineHeight = titleFontSize + 10;

    const totalTitleHeight = titleLines.length * lineHeight;
    const subtitleHeight = safeSubtitle ? 60 : 0;
    const totalContentHeight = totalTitleHeight + subtitleHeight;
    const startY = Math.round((THUMB_HEIGHT - totalContentHeight) / 2) + titleFontSize;
    const centerX = THUMB_WIDTH / 2;

    const titleSvg = titleLines
      .map((line, i) =>
        `<text x="${centerX}" y="${startY + i * lineHeight}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${titleFontSize}" font-weight="700" fill="#F0F0F5">${line}</text>`
      )
      .join("\n    ");

    const subtitleSvg = safeSubtitle
      ? `<text x="${centerX}" y="${startY + totalTitleHeight + 30}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#8B8B9E">${safeSubtitle}</text>`
      : "";

    // Decorative accent line above the title
    const accentY = startY - titleFontSize - 20;

    return `<svg width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${centerX - 30}" y="${accentY}" width="60" height="4" rx="2" fill="#6C63FF"/>
    ${titleSvg}
    ${subtitleSvg}
  </svg>`;
  }

  /**
   * Create a small gradient PNG for blending the image edge into the dark background.
   * 60px wide, full height, going from transparent to the background color.
   */
  private buildEdgeGradientPng(): Buffer {
    // Use an SVG with a linear gradient, rendered by sharp
    const svg = `<svg width="60" height="${THUMB_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(18,18,24)" stop-opacity="0"/>
        <stop offset="100%" stop-color="rgb(18,18,24)" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="60" height="${THUMB_HEIGHT}" fill="url(#fade)"/>
  </svg>`;
    return Buffer.from(svg);
  }

  /**
   * Simple word-wrap: split text into lines of approximately maxCharsPerLine.
   */
  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Limit to 4 lines max
    if (lines.length > 4) {
      const last = lines[3];
      lines.length = 4;
      lines[3] = last.length > maxCharsPerLine - 1
        ? last.slice(0, maxCharsPerLine - 1) + "\u2026"
        : last + "\u2026";
    }

    return lines;
  }
}

/**
 * Orchestrates thumbnail generation by dispatching to registered strategies.
 */
export class ThumbnailGenerator {
  private readonly strategies: ThumbnailGeneratorStrategy[];

  constructor(strategies?: ThumbnailGeneratorStrategy[]) {
    this.strategies = strategies ?? [
      new ArticleThumbnailStrategy(),
    ];
  }

  /**
   * Generate a composite thumbnail for the given source type and OG metadata.
   * Returns a PNG buffer, or null if no strategy supports the source type or generation fails.
   */
  async generate(
    sourceType: string,
    ogMetadata: OgMetadata,
  ): Promise<Buffer | null> {
    for (const strategy of this.strategies) {
      if (strategy.supports(sourceType)) {
        return strategy.generate(ogMetadata);
      }
    }
    return null;
  }
}

/** Default singleton instance. */
export const thumbnailGenerator = new ThumbnailGenerator();
