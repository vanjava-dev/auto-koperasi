import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Koperasi-AI — Sistem Manajemen Koperasi Cerdas",
    template: "%s | Koperasi-AI",
  },
  description:
    "Platform manajemen koperasi generasi berikutnya dengan filosofi Automation-First: webhook payment, AI credit scoring, OCR dokumen, dan jurnal otomatis.",
  keywords: ["koperasi", "simpan pinjam", "manajemen koperasi", "automation", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full antialiased bg-background text-foreground">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
