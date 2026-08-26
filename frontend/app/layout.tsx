import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasketIQ — Market Basket Intelligence",
  description: "Enter a basket in natural language and let AI understand it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-cream text-ink font-body">{children}</body>
    </html>
  );
}
