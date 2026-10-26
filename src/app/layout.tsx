import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { LegacyProvider } from "@/domain/store";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "LegacyAI",
  description:
    "Family continuity before inheritance, plus RM outreach and emergency-fund planning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sans.variable} h-full antialiased`}
    >
      <body>
        <Providers>
          <LegacyProvider>
            <Shell>{children}</Shell>
          </LegacyProvider>
        </Providers>
      </body>
    </html>
  );
}
