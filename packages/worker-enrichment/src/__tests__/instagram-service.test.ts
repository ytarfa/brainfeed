import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  InstagramService,
  InstagramSSRUnavailableError,
} from "../services/instagram-service";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Helpers — build Instagram HTML fixtures
// ---------------------------------------------------------------------------

/**
 * Build a minimal Instagram SSR-rendered HTML page with embedded data.
 */
function makeSSRHtml(options: {
  caption?: string;
  username?: string;
  fullName?: string;
  mediaType?: number;
  carouselMediaCount?: number;
  accessibilityCaption?: string;
  ogImage?: string;
} = {}): string {
  const captionText = options.caption ?? "This is a test caption #test";
  const username = options.username ?? "testuser";
  const fullName = options.fullName ?? "Test User";
  const mediaType = options.mediaType ?? 1;

  const metaTags: string[] = [];
  if (options.ogImage) {
    metaTags.push(`<meta property="og:image" content="${options.ogImage}" />`);
  }

  // Build embedded JSON data mimicking Instagram's SSR format
  const captionJson = `"caption":{"text":"${captionText.replace(/"/g, '\\"')}","pk":"12345","has_translation":null,"created_at":1774933217}`;
  const userJson = `"username":"${username}","full_name":"${fullName}"`;
  const mediaTypeJson = `"media_type":${mediaType}`;
  const carouselJson = options.carouselMediaCount
    ? `,"carousel_media_count":${options.carouselMediaCount}`
    : "";
  const accessibilityJson = options.accessibilityCaption
    ? `,"accessibility_caption":"${options.accessibilityCaption.replace(/"/g, '\\"')}"`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Instagram" />
  ${metaTags.join("\n  ")}
  <title>Instagram</title>
</head>
<body>
  <script type="text/javascript">
    window.__initialData = {${captionJson},${userJson},${mediaTypeJson}${carouselJson}${accessibilityJson}};
  </script>
</body>
</html>`;
}

/**
 * Build a minimal Instagram empty JS shell page (no SSR data).
 */
function makeEmptyShell(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noodp, noydir" />
  <meta name="theme-color" content="#ffffff" />
  <title>Instagram</title>
</head>
<body>
  <noscript>You need to enable JavaScript to use Instagram.</noscript>
  <script src="/static/bundles/main.js"></script>
</body>
</html>`;
}

function makeFetchResponse(
  html: string,
  status = 200,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
    text: vi.fn().mockResolvedValue(html),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

describe("InstagramService.classifyUrl", () => {
  describe("post URLs", () => {
    it("classifies /p/{shortcode}/ as post", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/p/DFnr9wdxJoI/",
      );
      expect(result).toEqual({ instagramType: "post", shortcode: "DFnr9wdxJoI" });
    });

    it("classifies /p/{shortcode} (no trailing slash) as post", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/p/DWiUsgBjbBe",
      );
      expect(result).toEqual({ instagramType: "post", shortcode: "DWiUsgBjbBe" });
    });

    it("handles shortcodes with hyphens and underscores", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/p/Ab_Cd-EfGhI/",
      );
      expect(result).toEqual({ instagramType: "post", shortcode: "Ab_Cd-EfGhI" });
    });
  });

  describe("reel URLs", () => {
    it("classifies /reel/{shortcode}/ as reel", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/reel/DWiTx5IgYHE/",
      );
      expect(result).toEqual({ instagramType: "reel", shortcode: "DWiTx5IgYHE" });
    });

    it("classifies /reels/{shortcode}/ as reel", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/reels/DWiTx5IgYHE/",
      );
      expect(result).toEqual({ instagramType: "reel", shortcode: "DWiTx5IgYHE" });
    });

    it("classifies /reel/{shortcode} (no trailing slash) as reel", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/reel/ABC123def45",
      );
      expect(result).toEqual({ instagramType: "reel", shortcode: "ABC123def45" });
    });
  });

  describe("IGTV URLs (treated as reel)", () => {
    it("classifies /tv/{shortcode}/ as reel", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/tv/ABC123def45/",
      );
      expect(result).toEqual({ instagramType: "reel", shortcode: "ABC123def45" });
    });

    it("classifies /tv/{shortcode} (no trailing slash) as reel", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/tv/XYZ789",
      );
      expect(result).toEqual({ instagramType: "reel", shortcode: "XYZ789" });
    });
  });

  describe("unrecognized URLs", () => {
    it("returns null for profile URLs", () => {
      expect(
        InstagramService.classifyUrl("https://www.instagram.com/natgeo/"),
      ).toBeNull();
    });

    it("returns null for story URLs", () => {
      expect(
        InstagramService.classifyUrl(
          "https://www.instagram.com/stories/natgeo/12345/",
        ),
      ).toBeNull();
    });

    it("returns null for explore pages", () => {
      expect(
        InstagramService.classifyUrl("https://www.instagram.com/explore/"),
      ).toBeNull();
    });

    it("returns null for the root URL", () => {
      expect(
        InstagramService.classifyUrl("https://www.instagram.com/"),
      ).toBeNull();
    });

    it("returns null for invalid URLs", () => {
      expect(InstagramService.classifyUrl("not-a-url")).toBeNull();
    });

    it("returns null for /p/ with query params in path (extra segments)", () => {
      expect(
        InstagramService.classifyUrl(
          "https://www.instagram.com/p/ABC123/comments/",
        ),
      ).toBeNull();
    });
  });

  describe("mobile URLs", () => {
    it("classifies m.instagram.com post URLs", () => {
      const result = InstagramService.classifyUrl(
        "https://m.instagram.com/p/DFnr9wdxJoI/",
      );
      expect(result).toEqual({ instagramType: "post", shortcode: "DFnr9wdxJoI" });
    });
  });

  describe("query parameters", () => {
    it("ignores query parameters for classification", () => {
      const result = InstagramService.classifyUrl(
        "https://www.instagram.com/p/DWiUsgBjbBe/?img_index=6",
      );
      expect(result).toEqual({ instagramType: "post", shortcode: "DWiUsgBjbBe" });
    });
  });
});

// ---------------------------------------------------------------------------
// SSR detection
// ---------------------------------------------------------------------------

describe("InstagramService.isSSR", () => {
  it("returns true for SSR-rendered HTML with caption data", () => {
    const html = makeSSRHtml({ caption: "Hello world" });
    expect(InstagramService.isSSR(html)).toBe(true);
  });

  it("returns false for empty JS shell", () => {
    const html = makeEmptyShell();
    expect(InstagramService.isSSR(html)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(InstagramService.isSSR("")).toBe(false);
  });

  it("returns false for random HTML without caption markers", () => {
    expect(
      InstagramService.isSSR("<html><body>Hello</body></html>"),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SSR HTML parsing (parseSSR)
// ---------------------------------------------------------------------------

describe("InstagramService.parseSSR", () => {
  describe("caption extraction", () => {
    it("extracts caption text from embedded JSON", () => {
      const html = makeSSRHtml({ caption: "This is the caption text" });
      const result = InstagramService.parseSSR(html);
      expect(result.caption).toBe("This is the caption text");
    });

    it("handles captions with emoji and special characters", () => {
      const html = makeSSRHtml({
        caption: "Great post! \\u2728 #amazing @friend",
      });
      const result = InstagramService.parseSSR(html);
      expect(result.caption).toContain("Great post!");
    });

    it("handles captions with newlines (JSON escaped)", () => {
      const html = makeSSRHtml({
        caption: "Line one\\nLine two\\nLine three",
      });
      const result = InstagramService.parseSSR(html);
      expect(result.caption).toContain("Line one");
      expect(result.caption).toContain("Line two");
    });

    it("throws InstagramSSRUnavailableError when caption text is empty", () => {
      // Build HTML that passes SSR check but has empty caption
      const html = `<!DOCTYPE html><html><body>
        <script>"caption":{"text":"","pk":"123"}</script>
      </body></html>`;
      // The isSSR check passes because the pattern exists, but caption is empty
      expect(() => InstagramService.parseSSR(html)).toThrow(
        InstagramSSRUnavailableError,
      );
    });
  });

  describe("author extraction", () => {
    it("extracts username and full name", () => {
      const html = makeSSRHtml({
        username: "metav3rse",
        fullName: "Metav3rse is for the Culture",
      });
      const result = InstagramService.parseSSR(html);
      expect(result.username).toBe("metav3rse");
      expect(result.fullName).toBe("Metav3rse is for the Culture");
    });

    it("returns null for missing username/fullName", () => {
      // Minimal SSR HTML with just a caption
      const html = `<!DOCTYPE html><html><head></head><body>
        <script>"caption":{"text":"Hello world","pk":"1"}</script>
      </body></html>`;
      const result = InstagramService.parseSSR(html);
      expect(result.username).toBeNull();
      expect(result.fullName).toBeNull();
    });
  });

  describe("media type extraction", () => {
    it("maps media_type 1 to image", () => {
      const html = makeSSRHtml({ mediaType: 1 });
      const result = InstagramService.parseSSR(html);
      expect(result.mediaType).toBe("image");
    });

    it("maps media_type 2 to video", () => {
      const html = makeSSRHtml({ mediaType: 2 });
      const result = InstagramService.parseSSR(html);
      expect(result.mediaType).toBe("video");
    });

    it("maps media_type 8 to carousel", () => {
      const html = makeSSRHtml({ mediaType: 8, carouselMediaCount: 7 });
      const result = InstagramService.parseSSR(html);
      expect(result.mediaType).toBe("carousel");
    });

    it("returns null for unknown media_type", () => {
      const html = makeSSRHtml({ mediaType: 99 });
      const result = InstagramService.parseSSR(html);
      expect(result.mediaType).toBeNull();
    });
  });

  describe("carousel metadata", () => {
    it("extracts carousel_media_count for carousel posts", () => {
      const html = makeSSRHtml({ mediaType: 8, carouselMediaCount: 7 });
      const result = InstagramService.parseSSR(html);
      expect(result.carouselMediaCount).toBe(7);
    });

    it("returns null carouselMediaCount for non-carousel posts", () => {
      const html = makeSSRHtml({ mediaType: 1 });
      const result = InstagramService.parseSSR(html);
      expect(result.carouselMediaCount).toBeNull();
    });
  });

  describe("accessibility caption", () => {
    it("extracts accessibility caption when present", () => {
      const html = makeSSRHtml({
        accessibilityCaption:
          "Photo by Test User on March 30, 2026. May be an image of text.",
      });
      const result = InstagramService.parseSSR(html);
      expect(result.accessibilityCaption).toContain("Photo by Test User");
    });

    it("returns null when no accessibility caption", () => {
      const html = makeSSRHtml({});
      const result = InstagramService.parseSSR(html);
      expect(result.accessibilityCaption).toBeNull();
    });
  });

  describe("OG image extraction", () => {
    it("extracts og:image when present", () => {
      const html = makeSSRHtml({
        ogImage: "https://scontent.cdninstagram.com/v/image.jpg",
      });
      const result = InstagramService.parseSSR(html);
      expect(result.ogImage).toBe(
        "https://scontent.cdninstagram.com/v/image.jpg",
      );
    });

    it("returns null when no og:image", () => {
      const html = makeSSRHtml({});
      const result = InstagramService.parseSSR(html);
      expect(result.ogImage).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Full extract flow (fetch + detect + parse)
// ---------------------------------------------------------------------------

describe("InstagramService.extract", () => {
  it("returns extracted data for SSR-rendered page", async () => {
    const html = makeSSRHtml({
      caption: "Google just released a quantum warning",
      username: "metav3rse",
      fullName: "Metav3rse is for the Culture",
      mediaType: 8,
      carouselMediaCount: 7,
      ogImage: "https://scontent.cdninstagram.com/v/t51.jpg",
    });
    mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

    const result = await InstagramService.extract(
      "https://www.instagram.com/p/DWiUsgBjbBe/",
    );

    expect(result.caption).toContain("quantum warning");
    expect(result.username).toBe("metav3rse");
    expect(result.fullName).toBe("Metav3rse is for the Culture");
    expect(result.mediaType).toBe("carousel");
    expect(result.carouselMediaCount).toBe(7);
    expect(result.ogImage).toBe("https://scontent.cdninstagram.com/v/t51.jpg");
  });

  it("throws InstagramSSRUnavailableError for empty JS shell", async () => {
    mockFetch.mockResolvedValueOnce(makeFetchResponse(makeEmptyShell()));

    await expect(
      InstagramService.extract("https://www.instagram.com/p/DFnr9wdxJoI/"),
    ).rejects.toThrow(InstagramSSRUnavailableError);
  });

  it("throws on non-2xx responses", async () => {
    mockFetch.mockResolvedValueOnce(makeFetchResponse("Not Found", 404));

    await expect(
      InstagramService.extract("https://www.instagram.com/p/ABC123/"),
    ).rejects.toThrow("Instagram fetch failed: HTTP 404");
  });

  it("throws on network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      InstagramService.extract("https://www.instagram.com/reel/XYZ789/"),
    ).rejects.toThrow("Network error");
  });

  it("uses Googlebot User-Agent", async () => {
    const html = makeSSRHtml({ caption: "Test caption" });
    mockFetch.mockResolvedValueOnce(makeFetchResponse(html));

    await InstagramService.extract("https://www.instagram.com/p/ABC123/");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.instagram.com/p/ABC123/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("Googlebot"),
        }),
      }),
    );
  });
});
