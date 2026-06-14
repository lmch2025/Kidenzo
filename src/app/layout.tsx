import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kidenzo - La plateforme de recommandation",
  description: "Recommandez des produits et gagnez de l'argent avec Kidenzo.",
  keywords: ["Kidenzo", "ecommerce", "recommandation", "affiliation", "gagner de l'argent"],
  authors: [{ name: "Kidenzo Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Kidenzo",
    description: "Recommandez des produits et gagnez de l'argent avec Kidenzo",
    url: "https://kidenzo.com",
    siteName: "Kidenzo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kidenzo",
    description: "Recommandez des produits et gagnez de l'argent avec Kidenzo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
