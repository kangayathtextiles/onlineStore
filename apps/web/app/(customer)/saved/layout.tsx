import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Garments Wishlist",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
