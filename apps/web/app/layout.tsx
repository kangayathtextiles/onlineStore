import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kangayath Web — Engineering Platform",
  description: "Enterprise web platform foundation and governance system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
