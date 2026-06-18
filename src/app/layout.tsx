import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { AppExitGuard } from "@/components/AppExitGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Important for app-like feel
};

export const metadata: Metadata = {
  title: "Kidenzo - La plateforme de recommandation",
  description: "Recommandez des produits et gagnez de l'argent avec Kidenzo.",
  keywords: ["Kidenzo", "ecommerce", "recommandation", "affiliation", "gagner de l'argent"],
  authors: [{ name: "Kidenzo Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kidenzo",
  },
  formatDetection: {
    telephone: false,
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Serwist handles offline gracefully, we don't need manual meta tags for that */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <AppExitGuard />
        {children}
        <PwaInstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
