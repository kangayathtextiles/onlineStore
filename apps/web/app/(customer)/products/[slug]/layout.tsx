import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { publicApi } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await publicApi.products.getBySlug(slug);
    const title = `${product.name} | Kangayath Clothing & Textiles`;
    const description =
      product.description ||
      `Explore ${product.name} at Kangayath digital showroom in Kalkandi, Palakkad, Kerala. Authentic textiles and garments available in store.`;
    const imageUrl = product.images?.[0]?.url;

    return {
      title,
      description,
      alternates: {
        canonical: `${siteConfig.url}/products/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}/products/${slug}`,
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    const formattedTitle = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      title: `${formattedTitle} | Kangayath Clothing & Textiles`,
      description: `Explore ${formattedTitle} at Kangayath digital showroom in Kalkandi, Palakkad, Kerala.`,
      alternates: {
        canonical: `${siteConfig.url}/products/${slug}`,
      },
    };
  }
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
