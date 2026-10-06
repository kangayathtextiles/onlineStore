import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";
import { siteConfig } from "@/lib/site-config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  themeColor: "#651714",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Kangayath | Clothing & Textiles Digital Showroom in Kerala",
    template: "%s | Kangayath",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  keywords: [
    "Kangayath",
    "Kangayath clothing store",
    "Kangayath textiles",
    "Kangayath Kerala",
    "Kangayath Palakkad",
    "Kangayath Kalkandi",
    "K G Garments",
    "Kerala traditional wear",
    "festive sarees Palakkad",
    "kasavu sarees Kalkandi",
    "clothing store near Kalkandi",
  ],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Kangayath | Clothing & Textiles Digital Showroom in Kerala",
    description: siteConfig.description,
    images: [
      {
        url: "/brand/logo.png",
        width: 800,
        height: 240,
        alt: "Kangayath Clothing & Textiles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kangayath | Clothing & Textiles Digital Showroom in Kerala",
    description: siteConfig.description,
    images: ["/brand/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen bg-canvas text-zinc-900 font-sans"
        suppressHydrationWarning
      >
        <ToastProvider>
          <SavedItemsProvider>{children}</SavedItemsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
