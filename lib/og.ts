// ============================================================
// Anima Pulse — OG image fetcher (best-effort, never throws)
// Used by the vault POST route to enrich thumbnails.
// ============================================================

/**
 * Fetch the og:image meta content from a URL.
 * Returns null on any error (network, timeout, parse).
 * Works in Node 18+ (native fetch with AbortController).
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AnimaPulseBot/1.0 (OG scraper)' },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      html = await res.text();
    } catch {
      clearTimeout(timer);
      return null;
    }

    // Match <meta property="og:image" content="..."> (order-insensitive)
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (!match || !match[1]) return null;

    const imgUrl = match[1].trim();
    // Basic sanity — must look like a URL
    if (!imgUrl.startsWith('http')) return null;

    return imgUrl;
  } catch {
    return null;
  }
}
