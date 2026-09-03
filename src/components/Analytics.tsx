"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getConsent, onConsentChange } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-M21CSXB2G2";

/** Google Analytics 4, loaded only after the visitor accepts cookies. */
export default function Analytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEnabled(getConsent() === "granted"), 0);
    const off = onConsentChange((v) => setEnabled(v === "granted"));
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);

  if (!enabled || !GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
