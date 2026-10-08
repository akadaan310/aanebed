"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Orb, UNFORMED } from "./Orb";
import { remember } from "./PearlView";
import { encode } from "@/lib/pearls/codec";
import { fromReply, fromWords } from "@/lib/pearls/model";

const SEEDS = [
  "A little game to teach my daughter multiplication",
  "Help me revise photosynthesis for Friday's exam",
  "The opening of a story about a lighthouse keeper who leaves notes",
  "A plan to finally learn the guitar this autumn",
];

/** The one thing to do on arrival: bring something, and watch it become a Pearl. */
export function Maker({ ai }: { ai: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(ai);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const el = ta.current; if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 360) + "px"; }, [text]);
  useEffect(() => { if (!busy) return; const t0 = Date.now(); const t = setInterval(() => setSecs(Math.round((Date.now() - t0) / 1000)), 400); return () => clearInterval(t); }, [busy]);

  const byHand = async () => {
    const p = fromWords(text);
    if (!p) return;
    const code = await encode(p);
    remember(p, code);
    router.push(`/pearl/${code}?born=new`);
  };

  const make = async () => {
    if (!text.trim() || busy) return;
    setErr(null);
    if (/```pearl/i.test(text)) {
      const p = fromReply(text, null);
      if (p) { const code = await encode(p); remember(p, code); router.push(`/pearl/${code}?born=returned`); return; }
    }
    if (!useAi || !ai) { await byHand(); return; }
    setBusy(true); setSecs(0);
    try {
      const r = await fetch("/api/pearls/shape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "It couldn't take shape just now.");
      remember(j.pearl, j.code);
      router.push(`/pearl/${j.code}?born=new`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  if (busy) return (
    <div className="forming mt-10 flex flex-col items-center text-center" role="status" aria-live="polite">
      <Orb look={UNFORMED} size={132} />
      <p className="mt-7 font-serif text-[1.25rem]">Claude Haiku 5.5 is giving it shape…</p>
      <p className="mt-1 text-[0.9rem] text-[var(--iv3)]">{secs}s · a real model, usually under twenty seconds</p>
      <p className="mt-6 max-w-[40ch] whitespace-pre-line font-serif text-[0.98rem] italic text-[var(--iv3)] opacity-70">“{text.length > 160 ? text.slice(0, 160) + "…" : text}”</p>
    </div>
  );

  return (
    <div className="mt-9 w-full max-w-xl rise-2">
      <form onSubmit={(e) => { e.preventDefault(); void make(); }} className="tray p-4 sm:p-5">
        <label htmlFor="seed" className="sr-only">Start with an idea, a question, notes, or something you made with an AI</label>
        <textarea id="seed" ref={ta} rows={3} value={text} maxLength={3000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void make(); }}
          placeholder="An idea, a question, some notes — or something you made with an AI…" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#e0d5c1] pt-3">
          {ai ? (
            <label className="flex cursor-pointer items-center gap-2 text-[0.85rem] text-[#574e42]">
              <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="h-4 w-4 accent-[#6f5b3e]" />
              Let Claude give it shape
            </label>
          ) : <span className="text-[0.85rem] text-[#574e42]">Made from your own words</span>}
          <button type="submit" disabled={!text.trim()} className="rounded-full bg-[#1e1a15] px-5 py-2.5 text-[0.98rem] font-medium text-[#f6f0e4] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] transition hover:bg-[#2c261f] disabled:opacity-40">Make a Pearl</button>
        </div>
      </form>
      {err && (
        <div role="alert" className="mt-4 rounded-2xl border border-[rgba(227,164,147,0.4)] bg-[rgba(227,164,147,0.08)] px-4 py-3 text-[0.93rem] text-[var(--iv)]">
          <p>{err}</p>
          <button type="button" onClick={byHand} className="mt-2 underline">Make it from my own words instead</button>
        </div>
      )}
      <div className="mt-6">
        <p className="mb-2 text-center text-[0.8rem] text-[var(--iv3)]">or start from</p>
        <div className="flex flex-wrap justify-center gap-2">{SEEDS.map((s) => <button key={s} type="button" className="seed" onClick={() => { setText(s); ta.current?.focus(); }}>{s}</button>)}</div>
      </div>
      <p className="mt-6 text-center text-[0.8rem] text-[var(--iv3)]">{ai ? "With the box ticked, a real model (Claude Haiku 5.5) shapes it. Untick it and your words are kept exactly as they are." : "AI help isn't switched on right now; your Pearl is made from your own words."} No account needed.</p>
    </div>
  );
}
