/** Analytics consent, stored per browser. Nothing is loaded until the visitor says yes. */
export type Consent = "granted" | "denied";
const KEY = "ruwange:consent";
const EVENT = "ruwange:consent";

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent | null) {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode etc. — treat as no consent */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function onConsentChange(cb: (value: Consent | null) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<Consent | null>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
