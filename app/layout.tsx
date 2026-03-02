import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClientSetup from "@/components/ClientSetup";
import ScrollToTop from "@/components/ScrollToTop";

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
  themeColor: "#7B5CF0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CineTrack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-body bg-bg-primary text-text-primary antialiased min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <ClientSetup />
        <ScrollToTop />
      </body>
    </html>
  );
}
