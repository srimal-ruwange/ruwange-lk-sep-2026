import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Frame from "@/components/Frame";
import Analytics from "@/components/Analytics";
import CookieBanner from "@/components/CookieBanner";
import { site } from "@/data/site";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — ${site.role}`,
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.description,
    type: "website",
    url: site.url,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.role}`, description: site.description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll>
          <Preloader />
          <Header />
          <Frame />
          {children}
          <CookieBanner />
          <Analytics />
          <div className="grain" aria-hidden="true" />
        </SmoothScroll>
      </body>
    </html>
  );
}
