import type Lenis from "lenis";

let instance: Lenis | null = null;
const pending: Array<(l: Lenis) => void> = [];

export function setLenis(l: Lenis | null) {
  instance = l;
  if (l) pending.splice(0).forEach((cb) => cb(l));
}

export function getLenis() {
  return instance;
}

/** Runs cb now if Lenis exists, otherwise as soon as it is created. */
export function withLenis(cb: (l: Lenis) => void) {
  if (instance) cb(instance);
  else pending.push(cb);
}

export function scrollToHash(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  const l = getLenis();
  if (l) l.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else target.scrollIntoView({ behavior: "smooth" });
}
