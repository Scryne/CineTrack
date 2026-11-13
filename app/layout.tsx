import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClientSetup from "@/components/ClientSetup";

import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

// Yazı tipleri derlemede indirilip uygulamayla birlikte sunulur (dış CSS isteği yok).
const bebas = Bebas_Neue({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CineTrack - Film ve Dizi Takip", template: "%s - CineTrack" },
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
    <html lang="tr" className={`${bebas.variable} ${inter.variable} ${mono.variable}`}>
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
