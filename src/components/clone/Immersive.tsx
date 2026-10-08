"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** On the clone experience the site chrome steps back; everywhere else it returns. */
export function Immersive() {
  const p = usePathname();
  useEffect(() => {
    const on = p.startsWith("/clone/");
    if (on) document.documentElement.dataset.immersive = ""; else delete document.documentElement.dataset.immersive;
  }, [p]);
  return null;
}
