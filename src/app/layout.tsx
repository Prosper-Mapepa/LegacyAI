import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientOnly } from "@/components/client-only";
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
  title: "LegacyAI",
  description:
    "AI-assisted wealth-transition and emergency-fund planning flow (synthetic prototype).",
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
          <ClientOnly fallback={<HeaderSkeleton />}>
            <SiteHeader />
          </ClientOnly>
          {/* Spacer for fixed header (h-14 on mobile; taller on md+) */}
          <div className="h-14 shrink-0 md:h-[4.25rem]" aria-hidden />
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
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
