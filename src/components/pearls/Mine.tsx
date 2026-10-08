"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Orb } from "./Orb";
import { readMine, forget, type Kept } from "@/lib/pearls/library";

/** A neutral look for list entries, from the id alone (the full Pearl is in its link). */
const lookOf = (k: Kept) => { const n = (i: number) => parseInt(k.id.slice(2 + i, 6 + i), 16) / 0xffff; return { hue: Math.round(n(0) * 360), tilt: Math.round(n(4) * 360), sheen: 0.35 + n(6) * 0.4, layers: Math.max(1, Math.min(7, k.hands)), seed: k.id.slice(2, 10) }; };

/** My Pearls: what this browser has kept, with each Pearl's descendants beneath it. */
export function Mine() {
  const [all, setAll] = useState<Kept[] | null>(null);
  useEffect(() => setAll(readMine()), []);
  if (all === null) return <div className="room" />;
  const ids = new Set(all.map((k) => k.id));
  const roots = all.filter((k) => !k.from || !ids.has(k.from));
  const kids = (id: string) => all.filter((k) => k.from === id);

  const Item = ({ k, depth }: { k: Kept; depth: number }) => (
    <li>
      <div className="flex items-center gap-4 rounded-3xl px-2 py-3 hover:bg-[rgba(242,234,219,0.04)] sm:px-4" style={{ marginLeft: Math.min(depth, 4) * 22 }}>
        <Link href={`/pearl/${k.code}`} className="flex min-w-0 flex-1 items-center gap-4 no-underline">
          <span className="shrink-0"><Orb look={lookOf(k)} size={depth ? 48 : 64} kept /></span>
          <span className="min-w-0">
            <span className="label">{k.kind} · {k.lastBy}</span>
            <span className="block truncate font-serif text-[1.2rem] text-[var(--iv)]">{k.title}</span>
            {k.essence && <span className="block truncate text-[0.88rem] text-[var(--iv2)]">{k.essence}</span>}
          </span>
        </Link>
        <button type="button" onClick={() => { forget(k.id); setAll(readMine()); }} className="shrink-0 rounded-full px-3 py-2 text-[0.8rem] text-[var(--iv3)] hover:text-[var(--iv)]" aria-label={`Remove “${k.title}” from My Pearls`}>Remove</button>
      </div>
      {kids(k.id).length > 0 && <ul>{kids(k.id).map((c) => <Item key={c.id} k={c} depth={depth + 1} />)}</ul>}
    </li>
  );

  return (
    <div className="room px-4 pb-24 pt-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="display max-w-[12ch]">My Pearls</h1>
        {all.length === 0 ? (
          <div className="mt-10">
            <p className="max-w-[44ch] text-[1.1rem] text-[var(--iv2)]">Nothing kept yet. Everything you make is kept here, in this browser.</p>
            <Link href="/" className="pbtn mt-8">Make your first Pearl</Link>
          </div>
        ) : (
          <>
            <p className="mt-4 max-w-[52ch] text-[1.02rem] text-[var(--iv2)]">{all.length} {all.length === 1 ? "Pearl" : "Pearls"}, kept in this browser. Versions sit beneath the Pearl they grew from.</p>
            <ul className="mt-10">{roots.map((k) => <Item key={k.id} k={k} depth={0} />)}</ul>
            <p className="mt-12 max-w-[56ch] text-[0.85rem] text-[var(--iv3)]">Kept here only — not on a server, not on your other devices. Each Pearl&apos;s link holds the whole Pearl, so copying a link (or downloading the file) keeps it anywhere.</p>
          </>
        )}
      </div>
    </div>
  );
}
