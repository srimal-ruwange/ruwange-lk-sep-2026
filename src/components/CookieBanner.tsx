"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { onReady } from "@/lib/ready";
import { getConsent, setConsent, onConsentChange } from "@/lib/consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // show once the intro has finished, only if no choice has been made yet
  useEffect(() => {
    let cancelled = false;
    const off = onReady(() => {
      if (getConsent() !== null) return;
      const t = setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, 1800);
      return () => clearTimeout(t);
    });
    // the footer's "Cookies" link clears the choice and reopens the banner
    const offChange = onConsentChange((v) => {
      if (v === null) setOpen(true);
    });
    return () => {
      cancelled = true;
      off();
      offChange();
    };
  }, []);

  useEffect(() => {
    if (!open || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
      gsap.fromTo(".cookie-rule", { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "power3.inOut", delay: 0.2 });
    }, ref);
    return () => ctx.revert();
  }, [open]);

  const choose = (value: "granted" | "denied") => {
    if (!ref.current) {
      setConsent(value);
      setOpen(false);
      return;
    }
    gsap.to(ref.current, {
      y: 16,
      opacity: 0,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        setConsent(value);
        setOpen(false);
      },
    });
  };

  if (!open) return null;

  return (
    <div ref={ref} className="cookie" role="dialog" aria-label="Cookies" aria-live="polite">
      <span className="cookie-rule" />
      <p className="cookie-title mono">Cookies</p>
      <p className="cookie-text">
        A few anonymous analytics cookies, so I can see which parts of this site people actually read. Nothing loads until
        you say yes.
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn cookie-accept" onClick={() => choose("granted")}>
          Accept <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="link mono" onClick={() => choose("denied")}>
          Decline
        </button>
      </div>
    </div>
  );
}
