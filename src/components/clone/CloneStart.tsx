"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./Field";
import { feel, addOwn, readOwn } from "@/lib/clone/feel";

/** The one action. Pressing it creates a real clone session on the server; nothing is simulated. */
export function CloneStart() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState(0);
  useEffect(() => setMine(readOwn().length), []);

  const start = async () => {
    setBusy(true); setErr(null);
    try { if (localStorage.getItem("pearls.sound") === null) localStorage.setItem("pearls.sound", "on"); } catch { /* fine */ }
    feel("emerge");
    try {
      const r = await fetch("/api/v1/clone", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "The Pearl couldn't begin.");
      addOwn({ token: j.token, owner_key: j.owner_key, created_at: new Date().toISOString() });
      router.push(`/clone/${j.token}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); feel("error"); }
  };

  return (
    <section className="relative -mt-16 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-16">
      <Field s={{ status: "WAITING", events: 0, turns: 0, children: 0, pulse: 0 }} label="A dark field with a single pearl, breathing." />
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="sr-only">Clone your AI</h1>
        <div className="h-[28svh]" aria-hidden="true" />
        <button type="button" onClick={start} aria-busy={busy} disabled={busy} className="clone-cta">{busy ? "Opening a doorway…" : "Clone your AI"}</button>
        <p className="mt-6 max-w-[30ch] text-[0.98rem] leading-relaxed text-ink-3">Give your AI a doorway. Bring back what it carries.</p>
        {err && <p role="alert" className="mt-4 text-[0.9rem] text-refuse">{err}</p>}
      </div>
      <nav aria-label="More" className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-6 text-[0.8rem] text-ink-3">
        {mine > 0 && <Link href="/clones" className="hover:text-ink">Your clones ({mine})</Link>}
        <Link href="/how" className="hover:text-ink">What is this?</Link>
        <Link href="/world" className="hover:text-ink">The world</Link>
      </nav>
    </section>
  );
}
