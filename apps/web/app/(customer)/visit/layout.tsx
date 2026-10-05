import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Visit Our Store in Kalkandi, Palakkad | Kangayath",
  description:
    "Store hours, driving directions, phone number, and Google Maps directions for Kangayath Clothing & Textiles on Main Anaikatti Road, Kalkandi, Palakkad, Kerala (PIN: 678582).",
  alternates: {
    canonical: `${siteConfig.url}/visit`,
  },
  openGraph: {
    title: "Visit Kangayath Retail Store | Kalkandi, Palakkad, Kerala",
    description:
      "Find store hours, driving directions, and contact information for Kangayath clothing and textiles store in Kalkandi, Palakkad, Kerala.",
    url: `${siteConfig.url}/visit`,
    type: "website",
  },
};

export default function VisitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
