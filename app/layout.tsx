import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClientSetup from "@/components/ClientSetup";

import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CineTrack - Film ve Dizi Takip",
  description:
    "Filmlerinizi ve dizilerinizi takip edin, izleme listenizi yönetin, bölüm ilerlemelerinizi kaydedin.",
  keywords: ["film", "dizi", "takip", "izleme listesi", "watchlist"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CineTrack",
  },
  openGraph: {
    title: "CineTrack - Film ve Dizi Takip",
    description: "Filmlerini ve dizilerini takip et, keşfet, puanla.",
    siteName: "CineTrack",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7B5CF0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-body bg-void text-text-pri antialiased min-h-screen flex flex-col">
        <AuthGuard>
          <Navbar />
          <ErrorBoundary>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </ErrorBoundary>
          <ClientSetup />

        </AuthGuard>
      </body>
    </html>
  );
}
