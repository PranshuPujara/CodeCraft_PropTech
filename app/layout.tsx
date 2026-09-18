import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rentwise — AI-Powered Rental Intelligence",
  description: "Make smarter rental decisions. See the true cost, compare trade-offs, understand your agreement, and get AI-powered recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-outfit antialiased">
        {children}
      </body>
    </html>
  );
}
