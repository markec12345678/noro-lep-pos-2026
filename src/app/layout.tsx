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
  title: "POS Research 2026 — Svetovna primerjava POS blagajn",
  description: "Raziskava 12 vodilnih svetovnih POS blagajn (Toast, Square, Lightspeed, Shopify, Lavu) z VLM analizo dizajna in konkretnimi priporočili za slovensko POS aplikacijo.",
  keywords: ["POS", "blagajna", "Toast", "Square", "Lightspeed", "Shopify", "Lavu", "restavracija", "VLM", "dizajn"],
  authors: [{ name: "POS Research Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "POS Research 2026 — Svetovna primerjava",
    description: "12 POS sistemov raziskanih, screenshot-i in VLM analiza dizajna",
    url: "https://chat.z.ai",
    siteName: "POS Research",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "POS Research 2026",
    description: "12 POS sistemov raziskanih z VLM analizo dizajna",
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
