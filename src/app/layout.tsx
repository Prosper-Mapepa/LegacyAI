import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientOnly } from "@/components/client-only";
import { PrototypeBanner } from "@/components/prototype-banner";
import { PrototypeFooter } from "@/components/prototype-footer";
import { Providers } from "@/components/providers";
import { HeaderSkeleton, SiteLoader } from "@/components/site-loader";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegacyAI — Demo Prototype",
  description:
    "Clickable demo prototype only. Synthetic data. Not a real bank, not financial advice, and not a live product.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col overflow-x-hidden antialiased`}
      >
        <Providers>
          <PrototypeBanner />
          <ClientOnly fallback={<HeaderSkeleton />}>
            <SiteHeader />
          </ClientOnly>
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-4 sm:py-4">
            <ClientOnly fallback={<SiteLoader fullPage />}>
              {children}
            </ClientOnly>
          </main>
          <PrototypeFooter />
        </Providers>
      </body>
    </html>
  );
}
