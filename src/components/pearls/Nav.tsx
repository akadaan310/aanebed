"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav({ items }: { items: readonly { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-0.5 text-[0.9rem] sm:gap-1 sm:text-[0.95rem]">
        {items.map((n) => {
          const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return <li key={n.href}><Link href={n.href} aria-current={on ? "page" : undefined} className={`rounded-full px-2.5 py-2 sm:px-3.5 ${on ? "bg-[rgba(242,234,219,0.08)]" : ""}`}>{n.label}</Link></li>;
        })}
      </ul>
    </nav>
  );
}
