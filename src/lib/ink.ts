import { ScrollTrigger } from "@/lib/gsap";

/** Sections that want the page inverted to ink while they're in view. The class stays on
 *  while at least one is active, so adjacent sections hand over without a flash of paper. */
const active = new Set<string>();

function apply() {
  document.documentElement.classList.toggle("is-dark", active.size > 0);
}

export function inkWhileInView(
  id: string,
  trigger: Element,
  range: { start: string; end: string | (() => string) } = { start: "top 55%", end: "bottom 55%" },
) {
  const st = ScrollTrigger.create({
    trigger,
    start: range.start,
    end: range.end,
    onToggle: (self) => {
      if (self.isActive) active.add(id);
      else active.delete(id);
      apply();
    },
  });
  return () => {
    st.kill();
    active.delete(id);
    apply();
  };
}
