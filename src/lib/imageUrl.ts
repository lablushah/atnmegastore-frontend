const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api$/, '');

/**
 * Converts a backend storage URL to a root-relative path so Next.js Image
 * optimizer uses the /storage rewrite instead of making a direct HTTP request
 * to localhost (which Next.js 15+ blocks as a private IP / SSRF risk).
 *
 * http://localhost:8000/storage/products/x.jpg → /storage/products/x.jpg
 * https://cdn.example.com/x.jpg               → unchanged (HTTPS external)
 * null / undefined                             → null
 */
export function storageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (API_BASE && url.startsWith(API_BASE + '/storage/')) {
    return url.slice(API_BASE.length);
  }
  return url;
}
