import * as React from "react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { CustomerMobileNav } from "@/components/customer/mobile-nav";
import { buildClothingStoreSchema } from "@/lib/schema";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeSchema = buildClothingStoreSchema();

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <CustomerNavbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <CustomerFooter />
      <React.Suspense fallback={null}>
        <CustomerMobileNav />
      </React.Suspense>
    </div>
  );
}
