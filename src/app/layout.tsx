import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientOnly } from "@/components/client-only";
import { PrototypeFooter } from "@/components/prototype-footer";
import { Providers } from "@/components/providers";
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
  title: "LegacyAI — Prototype",
  description:
    "AI-assisted wealth-transition and emergency-fund planning flow (synthetic prototype).",
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
          <ClientOnly
            fallback={
              <div className="border-b border-pnc-border bg-white px-3 py-3 text-sm text-pnc-slate sm:px-4">
                LegacyAI
              </div>
            }
          >
            <SiteHeader />
          </ClientOnly>
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
            <ClientOnly
              fallback={
                <p className="text-sm text-pnc-slate">Loading demo…</p>
              }
            >
              {children}
            </ClientOnly>
          </main>
          <PrototypeFooter />
        </Providers>
      </body>
    </html>
  );
}
