"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/time";

export default function Clock({ tz, seconds = true, className }: { tz: string; seconds?: boolean; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {now ? formatTime(now, tz, seconds) : "--:--"}
    </span>
  );
}
