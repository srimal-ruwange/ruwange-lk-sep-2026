"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import SectionMark from "./motion/SectionMark";
import Reveal from "./motion/Reveal";
import { site } from "@/data/site";

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [sentTo, setSentTo] = useState<string>("");
  const sentRef = useRef<HTMLDivElement>(null);

  // the "sent" plate: rule draws, tick draws itself, then the words rise in
  useEffect(() => {
    if (status !== "sent" || !sentRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".sent-rule", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, 0)
        .fromTo(".sent-tick", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut" }, 0.25)
        .fromTo(".sent-ring", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.2, ease: "power2.inOut" }, 0.15)
        .fromTo(".sent-title .line-inner", { yPercent: 130, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.08 }, 0.35)
        .fromTo(".sent-copy > *", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.8);
    }, sentRef);
    return () => ctx.revert();
  }, [status]);

  useGSAP(
    () => {
      gsap.from(".field", { y: 24, opacity: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: ".contact-form", start: "top 85%", once: true } });
      gsap.from(".contact-copy", { y: 16, opacity: 0, duration: 1, scrollTrigger: { trigger: ".contact-copy", start: "top 88%", once: true } });
    },
    { scope: root },
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setSentTo(String(data.email ?? ""));
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section ref={root} className="section container contact" id="contact">
      <SectionMark />
      <div className="contact-grid">
        <div>
          <Reveal as="h2" className="h-2 contact-title">
            Let&apos;s build the next one.
          </Reveal>
          <p className="lead contact-copy">
            Have a site that needs building properly, or an app that needs a front end with some life in it? Tell me about it.
            I&apos;m in {site.city} ({site.utc}), take a few projects at a time, and usually reply within a day.
          </p>
        </div>

        {status === "sent" ? (
          <div className="form-sent" ref={sentRef} role="status" aria-live="polite">
            <span className="sent-rule" />
            <svg className="sent-mark" viewBox="0 0 64 64" aria-hidden="true">
              <circle className="sent-ring" cx="32" cy="32" r="30" />
              <path className="sent-tick" d="M19 33.5 L28.5 43 L45.5 23" />
            </svg>
            <h3 className="sent-title h-3">
              <span className="line">
                <span className="line-inner">Message sent.</span>
              </span>
              <span className="line">
                <span className="line-inner">
                  <em>Thank you.</em>
                </span>
              </span>
            </h3>
            <div className="sent-copy">
              <p className="lead">A confirmation is on its way to {sentTo ? <strong>{sentTo}</strong> : "your inbox"}. I read every message myself and usually reply within a day, {site.city} time.</p>
              <div className="sent-meta mono">
                <span>Sent · {new Date().toLocaleTimeString("en-GB", { timeZone: site.timeZone, hour: "2-digit", minute: "2-digit" })} {site.utc}</span>
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setStatus("idle");
                    setSentTo("");
                  }}
                >
                  Send another <span className="arrow">↗</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
        <form className="contact-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="mono" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" placeholder="Your name" autoComplete="name" required minLength={2} />
          </div>
          <div className="field">
            <label className="mono" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" placeholder="you@email.com" autoComplete="email" required />
          </div>
          <div className="field">
            <label className="mono" htmlFor="message">
              Project
            </label>
            <textarea id="message" name="message" rows={3} placeholder="What are we building?" required minLength={10} />
            {/* honeypot: a name browsers won't autofill (Chrome autofills "company"), hidden from people */}
            <input className="hp" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          </div>
          <div className="form-foot">
            <button className="btn" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending" : "Send it"} <span aria-hidden="true">→</span>
            </button>
            {status === "error" && (
              <p className="form-status mono err">
                <span className="dot" /> {error}
              </p>
            )}
          </div>
        </form>
        )}
      </div>
    </section>
  );
}
