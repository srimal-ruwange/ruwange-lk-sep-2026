/** Tiny pub/sub for "preloader finished" so sections can start their intros. */
let ready = false;
const subs: Array<() => void> = [];

export function markReady() {
  if (ready) return;
  ready = true;
  subs.splice(0).forEach((cb) => cb());
}

export function isReady() {
  return ready;
}

export function onReady(cb: () => void) {
  if (ready) {
    cb();
    return () => {};
  }
  subs.push(cb);
  return () => {
    const i = subs.indexOf(cb);
    if (i > -1) subs.splice(i, 1);
  };
}
