import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    {
      url: `${siteUrl}/saved`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // Fetch published products
    const res = await fetch(`${apiUrl}/api/v1/public/products?page_size=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        const productUrls: MetadataRoute.Sitemap = data.items.map((prod: { slug: string; updated_at?: string }) => ({
          url: `${siteUrl}/products/${prod.slug}`,
          lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
        dynamicRoutes = dynamicRoutes.concat(productUrls);
      }
    }

    // Fetch categories
    const catRes = await fetch(`${apiUrl}/api/v1/public/categories`, {
      next: { revalidate: 3600 },
    });
    if (catRes.ok) {
      const catData = await catRes.json();
      if (Array.isArray(catData)) {
        const categoryUrls: MetadataRoute.Sitemap = catData.map((cat: { slug: string }) => ({
          url: `${siteUrl}/categories/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
        dynamicRoutes = dynamicRoutes.concat(categoryUrls);
      }
    }
  } catch {
    // Graceful fallback during static build when backend API is offline
  }

  return [...staticRoutes, ...dynamicRoutes];
}
