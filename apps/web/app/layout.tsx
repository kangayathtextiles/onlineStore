import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SavedItemsProvider } from "@/lib/saved-items-context";

export const metadata: Metadata = {
  title: "KANGAYATH — Digital Showroom & Product Discovery",
  description:
    "Explore traditional handlooms, silks, and contemporary garments available at our physical store. Real-time availability check.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 font-sans">
        <ToastProvider>
          <SavedItemsProvider>{children}</SavedItemsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
