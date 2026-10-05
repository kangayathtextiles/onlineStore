import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Clothing & Garments Catalog | Kangayath Textiles Kalkandi",
  description:
    "Explore our complete garment catalog at Kangayath digital showroom in Kalkandi, Palakkad. Discover authentic Kerala handlooms, festive sarees, dhotis, wedding silks, and everyday apparel.",
  alternates: {
    canonical: `${siteConfig.url}/products`,
  },
  openGraph: {
    title: "Garments Catalog | Kangayath Digital Showroom",
    description:
      "Explore Kerala handlooms, festive sarees, dhotis, wedding silks, and everyday apparel at Kangayath in Kalkandi, Palakkad, Kerala.",
    url: `${siteConfig.url}/products`,
    type: "website",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
