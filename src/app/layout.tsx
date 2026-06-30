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
  title: "Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026",
  description: "Noro Lep POS je najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa in kuhinjskim zaslonom. TEXT za natakarje, SLIKE za goste.",
  keywords: ["POS", "blagajna", "FURS", "restavracija", "kuhinjski zaslon", "AI", "rezervacije", "zaloge", "Slovenija"],
  authors: [{ name: "Noro Lep POS" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Noro Lep POS — Najlepša slovenska restavracijska blagajna",
    description: "AI-poganjana POS blagajna z avtomatskim FURS in kuhinjskim zaslonom. 542 restavracij že zaupa nam.",
    url: "https://chat.z.ai",
    siteName: "Noro Lep POS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noro Lep POS — Najlepša slovenska blagajna",
    description: "AI-poganjana POS blagajna z avtomatskim FURS in kuhinjskim zaslonom.",
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
