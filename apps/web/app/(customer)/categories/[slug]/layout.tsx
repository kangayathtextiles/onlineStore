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
    const cats = await publicApi.categories.list();
    const matched = cats.find((c) => c.slug === slug);
    if (matched) {
      const title = `${matched.name} | Kangayath Clothing & Textiles`;
      const description =
        matched.description ||
        `Browse authentic ${matched.name} collection at Kangayath digital showroom in Kalkandi, Palakkad, Kerala.`;
      return {
        title,
        description,
        alternates: {
          canonical: `${siteConfig.url}/categories/${slug}`,
        },
        openGraph: {
          title,
          description,
          url: `${siteConfig.url}/categories/${slug}`,
        },
      };
    }
  } catch {
    // API unavailable or fallback
  }

  const formattedName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedName} | Kangayath Clothing & Textiles`,
    description: `Discover ${formattedName} garments at Kangayath digital showroom in Kalkandi, Palakkad, Kerala.`,
    alternates: {
      canonical: `${siteConfig.url}/categories/${slug}`,
    },
  };
}

export default function CategoryDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
