"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readOwn, type Own } from "@/lib/clone/feel";

/** The clones this browser started. The list is a convenience cache; each state comes from the server. */
export function Clones() {
  const [rows, setRows] = useState<(Own & { status?: string; name?: string | null })[] | null>(null);
  useEffect(() => {
    const own = readOwn().reverse();
    setRows(own);
    Promise.all(own.map(async (o) => { try { const r = await fetch(`/api/v1/clone/${o.token}`, { cache: "no-store" }); const j = await r.json(); return { ...o, status: r.ok ? j.status : r.status === 404 ? "GONE" : "?", name: j.clone?.declared?.identity?.name ?? j.clone?.declared?.source?.model ?? null }; } catch { return { ...o, status: "?" }; } })).then(setRows);
  }, []);
  if (rows === null) return <p className="text-ink-3">Looking…</p>;
  if (!rows.length) return <p className="text-ink-2">No clones from this browser yet. <Link href="/" className="underline">Clone your AI</Link>.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.token}><Link href={`/clone/${r.token}`} className="glass flex flex-wrap items-center gap-3 !rounded-2xl px-4 py-3 no-underline">
          <span className="min-w-0 flex-1 font-mono text-[0.85rem] text-ink">{r.name ? `${r.name} · ` : ""}{r.token}</span>
          <span className="text-[0.8rem] text-ink-3">{(r.status ?? "…").toLowerCase()}{r.parent ? " · branch" : ""} · {new Date(r.created_at).toLocaleDateString()}</span>
        </Link></li>
      ))}
    </ul>
  );
}
