import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atnmegastore.ca';
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:8000/api';

async function safeFetch(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // Handle both plain arrays and paginated {data: [...]} responses
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, cmsPages, posts, events] = await Promise.all([
    safeFetch(`${API_URL}/products?per_page=500`),
    safeFetch(`${API_URL}/categories`),
    safeFetch(`${API_URL}/pages`),
    safeFetch(`${API_URL}/posts?per_page=200`),
    safeFetch(`${API_URL}/events?per_page=200`),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/products`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/blog`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/events`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/about`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/cookies`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/shipping`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/returns`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/store-location`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
    url:             `${BASE_URL}/products/${p.slug}`,
    lastModified:    new Date(p.updated_at ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
    url:             `${BASE_URL}/products?category=${c.slug}`,
    lastModified:    new Date(c.updated_at ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }));

  const cmsRoutes: MetadataRoute.Sitemap = cmsPages.map((p: any) => ({
    url:             `${BASE_URL}/pages/${p.slug}`,
    lastModified:    new Date(p.updated_at ?? Date.now()),
    changeFrequency: 'monthly' as const,
    priority:        0.5,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p: any) => ({
    url:             `${BASE_URL}/blog/${p.slug}`,
    lastModified:    new Date(p.updated_at ?? Date.now()),
    changeFrequency: 'monthly' as const,
    priority:        0.6,
  }));

  const eventRoutes: MetadataRoute.Sitemap = events.map((e: any) => ({
    url:             `${BASE_URL}/events/${e.slug}`,
    lastModified:    new Date(e.updated_at ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority:        0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...cmsRoutes, ...postRoutes, ...eventRoutes];
}
