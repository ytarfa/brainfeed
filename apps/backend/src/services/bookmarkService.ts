const SOURCE_TYPE_MAP: Record<string, string> = {
  "github.com": "github",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "instagram.com": "instagram",
  "reddit.com": "reddit",
  "amazon.com": "amazon",
  "arxiv.org": "academic",
  "scholar.google.com": "academic",
};

export function detectSourceType(url?: string): string {
  if (!url) return "manual";
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_TYPE_MAP[hostname] ?? "generic";
  } catch {
    return "generic";
  }
}

export function getPaginationParams(query: {
  page?: unknown;
  limit?: unknown;
}): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(query.limit ?? "20"), 10) || 20)
  );
  return { page, limit, offset: (page - 1) * limit };
}
