import * as React from "react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";

const STORE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Kangayath",
  alternateName: "Kangayath Clothing Store",
  description:
    "Physical retail clothing store and digital showroom in Kerala specializing in authentic Kerala handlooms, festive sarees, dhotis, wedding silks, and everyday apparel.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kangayath.in",
  telephone: "+91-98765-43210",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Main Bazaar Road, Near Central Junction",
    addressLocality: "Thrissur",
    addressRegion: "Kerala",
    postalCode: "680001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 10.5276,
    longitude: 76.2144,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:30",
      closes: "20:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "19:00",
    },
  ],
  hasMap: "https://maps.google.com/?q=Kangayath+Clothing+Store+Thrissur",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STORE_STRUCTURED_DATA) }}
      />
      <CustomerNavbar />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </div>
  );
}
