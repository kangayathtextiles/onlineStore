import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteConfig.url;
  const apiUrl = siteConfig.apiUrl;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/visit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // 1. Fetch published products with safe pagination across all pages
    let page = 1;
    let totalPages = 1;
    const maxPages = 10; // Up to 1,000 products safety boundary

    while (page <= totalPages && page <= maxPages) {
      try {
        const res = await fetch(`${apiUrl}/api/v1/public/products?page=${page}&page_size=100`, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        });

        if (!res.ok) break;

        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          for (const prod of data.items) {
            if (prod && prod.slug) {
              dynamicRoutes.push({
                url: `${siteUrl}/products/${prod.slug}`,
                lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
                changeFrequency: "weekly",
                priority: 0.8,
              });
            }
          }
          totalPages = data.total_pages || 1;
        } else {
          break;
        }
      } catch {
        break;
      }
      page++;
    }

    // 2. Fetch public categories
    const catRes = await fetch(`${apiUrl}/api/v1/public/categories`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (catRes.ok) {
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        for (const cat of catData) {
          if (cat && cat.slug) {
            dynamicRoutes.push({
              url: `${siteUrl}/categories/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }
      }
    }
  } catch {
    // Graceful fallback during static build when backend API is offline
  }

  return [...staticRoutes, ...dynamicRoutes];
}
