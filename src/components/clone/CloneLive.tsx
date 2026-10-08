"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./Field";
import { feel, readOwn, addOwn, dropOwn } from "@/lib/clone/feel";
import { fromQuery } from "@/lib/clone/protocol";
import { copyText } from "@/components/living/parts";
import { soundOn, setSound } from "@/lib/v6/sound";

type Ev = { sequence: number; type: string; at: string; source: string; hash: string; previous_hash: string; payload: Record<string, unknown> };
export interface PublicState {
  token: string; status: string; kind: string; parent: string | null; created_at: string; expires_at: string | null; sequence: number; head: string | null; opened: boolean;
  rejections: { at: string; missing: string[]; problems: string[] }[];
  clone: null | {
    captured: { conversation: { role: string; text: string }[]; context: string | null };
    declared: { source: { model: string | null; provider: string | null; session: string | null }; identity: { name: string | null; calls_user: string | null; relationship: string | null }; memory: string[]; preferences: string[]; threads: string[]; confirm: string };
    derived: Record<string, unknown>; unavailable: string[]; verified_at: string; pearl_id: string; payload_hash: string;
  };
  children: { token: string; kind: string; at: string }[];
  events: Ev[];
}

const SAY: Record<string, string> = { PROTOCOL_READ: "Something opened the doorway.", RESPONSE_REJECTED: "The response arrived, but the clone is incomplete.", RESPONSE_RECEIVED: "Something arrived.", VERIFIED: "Your clone has arrived.", CONTINUED: "A continuation began.", FORKED: "A new branch began." };
type Phase = "waiting" | "arrived" | "verifying" | "alive" | "expired" | "deleted";

function phaseOf(s: PublicState): Phase {
  if (s.status === "ALIVE") return "alive";
  if (s.status === "EXPIRED") return "expired";
  if (s.status === "DELETED") return "deleted";
  if (s.status === "RECEIVED") return "verifying";
  return "waiting";
}

/** Find what an AI sent back in a pasted reply: the return URL, or the JSON. Nothing is fetched. */
export function extractResponse(text: string, token: string): Record<string, unknown> | null {
  const m = text.match(new RegExp(`https?://[^\\s<>"'\`]*?/clone/${token}/r\\?[^\\s<>"'\`]+`));
  if (m) { try { return fromQuery(new URL(m[0].replace(/[).,;]+$/, "")).searchParams); } catch { /* try JSON */ } }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  for (const cand of [fenced?.[1], text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)]) {
    if (!cand) continue;
    try { const j = JSON.parse(cand); if (j && typeof j === "object") return j; } catch { /* next */ }
  }
  return null;
}

export function CloneLive({ initial, origin, instructionsText }: { initial: PublicState; origin: string; instructionsText: string }) {
  const router = useRouter();
  const [s, setS] = useState<PublicState>(initial);
  const [phase, setPhase] = useState<Phase>(phaseOf(initial));
  const [announce, setAnnounce] = useState("");
  const [pulse, setPulse] = useState(0);
  const [paste, setPaste] = useState("");
  const [sendMsg, setSendMsg] = useState<{ tone: "ok" | "bad"; text: string; missing?: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [sound, setSoundState] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const seen = useRef(initial.sequence);
  const live = useRef<"sse" | "poll" | "none">("none");
  const address = `${origin}/clone/${s.token}`;

  useEffect(() => { setOwner(readOwn().find((o) => o.token === s.token)?.owner_key ?? null); setSoundState(soundOn()); }, [s.token]);
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200); };

  /** A new state arrived from the server: let each new event travel through the interface, in order. */
  const receive = useCallback((next: PublicState) => {
    if (next.sequence <= seen.current && next.status === s.status) return;
    const fresh = next.events.filter((e) => e.sequence > seen.current);
    seen.current = next.sequence;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const types = fresh.map((e) => e.type);
    if (types.includes("RESPONSE_RECEIVED") && types.includes("VERIFIED")) {
      // stage the arrival: something arrived → verifying → cloned. Each step names a real event.
      setPulse((p) => p + 1); setPhase("arrived"); setAnnounce(SAY.RESPONSE_RECEIVED); feel("arrive");
      setTimeout(() => { setPhase("verifying"); setAnnounce("Verifying the continuity record."); }, reduce ? 200 : 1100);
      setTimeout(() => { setS(next); setPhase(phaseOf(next)); setPulse((p) => p + 1); setAnnounce(SAY.VERIFIED); feel("resolve", "Your clone has arrived."); }, reduce ? 400 : 2400);
      return;
    }
    setS(next); setPhase(phaseOf(next));
    for (const t of types) {
      if (SAY[t]) setAnnounce(SAY[t]);
      if (t === "PROTOCOL_READ") feel("opened");
      if (t === "RESPONSE_REJECTED") feel("error");
      if (t === "CONTINUED" || t === "FORKED") feel("branch");
    }
    if (fresh.length) setPulse((p) => p + 1);
  }, [s.status]);

  // live: Server-Sent Events, with polling as the fallback
  useEffect(() => {
    if (phase === "deleted") return;
    let es: EventSource | null = null, poll: ReturnType<typeof setInterval> | null = null, errors = 0;
    const startPoll = () => {
      if (poll) return; live.current = "poll";
      poll = setInterval(async () => { try { const r = await fetch(`/api/v1/clone/${s.token}`, { cache: "no-store" }); if (r.ok) receive(await r.json()); } catch { /* keep trying */ } }, 3000);
    };
    if (typeof EventSource !== "undefined") {
      es = new EventSource(`/api/v1/clone/${s.token}/stream?after=${seen.current}`);
      live.current = "sse";
      es.addEventListener("state", (e) => { errors = 0; try { receive(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ } });
      es.onerror = () => { if (++errors > 4) { es?.close(); startPoll(); } };
    } else startPoll();
    return () => { es?.close(); if (poll) clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.token, receive]);

  const copyAddress = async () => { feel("tap"); const ok = await copyText(`Clone this session for me: open ${address} and follow the instructions there. If you can't open links, tell me and I'll paste them.`); say(ok ? "Copied. Give it to your AI." : "Couldn't copy. Select the address instead."); };
  const copyInstructions = async () => { feel("tap"); const ok = await copyText(instructionsText); say(ok ? "Copied the full instructions, for an AI that can't open links." : "Couldn't copy."); };
  const copyPearl = async () => { feel("tap"); const ok = await copyText(address); say(ok ? "Pearl address copied. Anyone with it can open this clone." : "Couldn't copy."); };

  const bringBack = async () => {
    setSendMsg(null);
    const body = extractResponse(paste, s.token);
    if (!body) { setSendMsg({ tone: "bad", text: "No clone response in that text. Paste your AI's whole reply: it should contain this Pearl's return link, or a JSON block." }); feel("error"); return; }
    setBusy("bring");
    try {
      const r = await fetch(`/api/v1/clone/${s.token}/events`, { method: "POST", headers: { "Content-Type": "application/json", "X-Pearl-Channel": "relayed" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 422) setSendMsg({ tone: "bad", text: "The response arrived, but the clone is incomplete.", missing: [...(j.missing ?? []), ...(j.problems ?? [])] });
      else if (!r.ok) setSendMsg({ tone: "bad", text: j.message ?? "That couldn't be cloned." });
      else { setPaste(""); if (j.state) receive(j.state); }
    } catch { setSendMsg({ tone: "bad", text: "The Pearl couldn't be reached. Try again." }); }
    setBusy(null);
  };

  const child = async (kind: "continuation" | "fork") => {
    setBusy(kind); feel("branch");
    try {
      const r = await fetch(`/api/v1/clone/${s.token}/children`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      addOwn({ token: j.token, owner_key: j.owner_key, created_at: new Date().toISOString(), parent: s.token });
      router.push(`/clone/${j.token}`);
    } catch (e) { say((e as Error).message || "That couldn't begin."); setBusy(null); }
  };

  const remove = async () => {
    if (!owner || !confirm("Delete this clone? Its captured material is removed for good.")) return;
    const r = await fetch(`/api/v1/clone/${s.token}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_key: owner }) });
    if (r.ok) { dropOwn(s.token); setS({ ...s, status: "DELETED", clone: null, events: [] }); setPhase("deleted"); setAnnounce("This Pearl was deleted."); } else say("Only the browser that created this clone can delete it.");
  };

  const c = s.clone;
  const step = phase === "alive" ? 4 : s.opened || phase !== "waiting" ? 3 : 1;
  const lastRejection = s.rejections.at(-1);
  const statusLine = phase === "waiting" ? (s.opened ? "Something opened the doorway. Waiting for it to answer." : "Your Pearl is waiting for its other voice.") : phase === "arrived" ? "Something arrived." : phase === "verifying" ? "Verifying." : phase === "alive" ? "Alive." : phase === "expired" ? "This address has expired." : "This Pearl was deleted.";

  return (
    <div className="relative">
      <section className="relative -mt-16 min-h-[100svh] overflow-hidden px-4 pb-10 pt-20" aria-labelledby="clone-h">
        <Field s={{ status: phase === "alive" ? "ALIVE" : s.status, events: s.sequence, turns: c?.captured.conversation.length ?? 0, children: s.children.length, pulse }} anchor={0.2} scale={0.62} label={`The Pearl: ${statusLine} ${s.sequence} events in its history${c ? `, ${c.captured.conversation.length} turns captured` : ""}${s.children.length ? `, ${s.children.length} branches` : ""}.`} />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-7.5rem)] max-w-xl flex-col">
          <div className="flex items-center justify-end text-[0.78rem] text-ink-3">
            <button type="button" aria-pressed={sound} onClick={() => { setSound(!sound); setSoundState(!sound); }} className="hover:text-ink">{sound ? "sound on" : "sound off"}</button>
          </div>
          <div className="h-[30svh] shrink-0 sm:h-[32svh]" aria-hidden="true" />
          <h1 id="clone-h" className="text-center font-serif text-[clamp(1.9rem,7vw,3rem)] leading-tight">{phase === "alive" ? (c?.declared.identity.name ? `${c.declared.identity.name}, cloned.` : "Cloned.") : statusLine}</h1>
          <p role="status" aria-live="polite" className="sr-only">{announce}</p>

          {(phase === "waiting" || phase === "arrived" || phase === "verifying") && (
            <div className="mt-6 space-y-6">
              <ol className="mx-auto w-fit space-y-1.5" aria-label="Four steps">
                {[["Copy", 1], ["Give it to your AI", 2], ["Bring it back", 3], ["Watch it live", 4]].map(([k, n]) => <li key={k} className="step" aria-current={n === step ? "step" : undefined}><b>{n}</b>{k}</li>)}
              </ol>
              <div className="glass-strong p-4 text-center">
                <p className="addr">{address}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={copyAddress} className="btn-glow">Copy</button>
                  <button type="button" onClick={copyInstructions} className="btn-glass !min-h-10 text-[0.85rem]">Copy full instructions</button>
                </div>
                <p className="mt-3 text-[0.8rem] text-ink-3">Paste it into ChatGPT, Claude, Gemini, any AI. It can answer by itself if it can open links, or give you something to bring back.</p>
              </div>
              {lastRejection && <div className="glass-strong p-4 text-[0.88rem]" role="alert"><p className="text-refuse">A response arrived, but the clone is incomplete.</p><ul className="mt-2 list-disc pl-5 text-ink-2">{[...lastRejection.missing, ...lastRejection.problems.filter((p) => !p.includes("recommended"))].map((x) => <li key={x}>Missing or wrong: {x}</li>)}</ul><p className="mt-2 text-ink-3">Ask your AI to try again with those parts.</p></div>}
              <form className="glass-strong space-y-2 p-4" onSubmit={(e) => { e.preventDefault(); void bringBack(); }}>
                <label htmlFor="bring" className="block font-serif text-lg">Bring it back</label>
                <p className="text-[0.82rem] text-ink-3">If your AI couldn&apos;t send it by itself, paste its whole reply here.</p>
                <textarea id="bring" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} spellCheck={false} className="w-full rounded-xl border border-white/15 bg-white/5 p-3 font-mono text-[0.78rem] text-ink outline-none focus:border-ink-2" placeholder={`${address}/r?v=1&confirm=yes&…`} />
                <button type="submit" className="btn-glass !min-h-10" disabled={!paste.trim() || busy === "bring"}>{busy === "bring" ? "Bringing it back…" : "Bring it back"}</button>
                {sendMsg && <div role="alert" className={`text-[0.85rem] ${sendMsg.tone === "bad" ? "text-refuse" : "text-emerald"}`}>{sendMsg.text}{sendMsg.missing?.length ? <ul className="mt-1 list-disc pl-5 text-ink-2">{sendMsg.missing.map((m) => <li key={m}>{m}</li>)}</ul> : null}</div>}
              </form>
            </div>
          )}

          {phase === "alive" && c && (
            <div className="mt-4 space-y-6 text-center">
              <p className="text-ink-2">{c.declared.source.model ? <>{c.declared.source.model}{c.declared.source.provider ? ` · ${c.declared.source.provider}` : ""} <span className="text-ink-3">(as it says)</span></> : "An AI that didn't name its model"} · {c.captured.conversation.length} {c.captured.conversation.length === 1 ? "turn" : "turns"} · {c.declared.memory.length} {c.declared.memory.length === 1 ? "memory" : "memories"} · {c.declared.threads.length} open {c.declared.threads.length === 1 ? "thread" : "threads"}</p>
              <p className="font-mono text-[0.78rem] text-ink-3">{s.token} · {c.pearl_id} · {s.sequence} events</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => child("continuation")} className="btn-glow" disabled={!!busy}>{busy === "continuation" ? "Opening…" : "Continue"}</button>
                <button type="button" onClick={copyPearl} className="btn-glass">Copy Pearl</button>
                <button type="button" onClick={() => child("fork")} className="btn-glass" disabled={!!busy}>{busy === "fork" ? "Opening…" : "Clone again"}</button>
              </div>
              <p className="text-[0.8rem] text-ink-3">Continue hands this clone to another AI. Clone again starts a new branch from the same Pearl. Neither changes this one.</p>
            </div>
          )}
          {phase === "expired" && <p className="mt-6 text-center"><Link href="/" className="btn-glow">Start a new clone</Link></p>}
          {phase === "deleted" && <p className="mt-6 text-center text-ink-2">Its captured material was removed. <Link href="/" className="underline">Start a new clone</Link></p>}
        </div>
      </section>

      {phase !== "deleted" && (
        <section className="wrap max-w-3xl space-y-8 pb-16 pt-4 text-[0.9rem]">
          {(s.parent || s.children.length > 0) && (
            <div>
              <h2 className="zone-title mb-3">Lineage</h2>
              <ul className="space-y-1 font-mono text-[0.8rem]">
                {s.parent && <li>← from <Link href={`/clone/${s.parent}`} className="underline">{s.parent}</Link> ({s.kind})</li>}
                {s.children.map((ch) => <li key={ch.token}>→ {ch.kind}: <Link href={`/clone/${ch.token}`} className="underline">{ch.token}</Link></li>)}
              </ul>
            </div>
          )}
          {c && (
            <details>
              <summary className="cursor-pointer text-ink-2 hover:text-ink">What was cloned — and what wasn&apos;t</summary>
              <div className="mt-4 space-y-6">
                <div><h3 className="zone-title mb-2">Captured · received through the protocol</h3>
                  {c.captured.context && <p className="text-ink-2"><b className="font-medium text-ink">Context.</b> {c.captured.context}</p>}
                  <ol className="mt-2 space-y-1">{c.captured.conversation.map((t, i) => <li key={i} className="text-ink-2"><span className="mr-2 font-mono text-[0.72rem] uppercase text-ink-3">{t.role}</span>{t.text}</li>)}</ol>
                </div>
                <div><h3 className="zone-title mb-2">Declared · said by the AI, not verifiable</h3>
                  <ul className="space-y-1 text-ink-2">
                    <li>model {c.declared.source.model ?? "—"} · provider {c.declared.source.provider ?? "—"} · called {c.declared.identity.name ?? "—"} · calls you {c.declared.identity.calls_user ?? "—"}</li>
                    {c.declared.memory.map((m) => <li key={"m" + m}>memory: {m}</li>)}{c.declared.preferences.map((m) => <li key={"p" + m}>preference: {m}</li>)}{c.declared.threads.map((m) => <li key={"t" + m}>open thread: {m}</li>)}
                    <li>confirmation: “{c.declared.confirm}”</li>
                  </ul>
                </div>
                <div><h3 className="zone-title mb-2">Derived · computed here</h3><p className="break-all font-mono text-[0.75rem] text-ink-2">{Object.entries(c.derived).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</p></div>
                <div><h3 className="zone-title mb-2">Unavailable · not in this clone</h3><ul className="list-disc pl-5 text-ink-2">{c.unavailable.map((u) => <li key={u}>{u}</li>)}</ul></div>
              </div>
            </details>
          )}
          <details>
            <summary className="cursor-pointer text-ink-2 hover:text-ink">History · {s.sequence} events, each with its own address</summary>
            <ol className="mt-3 space-y-1.5 font-mono text-[0.75rem] text-ink-2" aria-label="Event chain">
              {s.events.map((e) => <li key={e.sequence}><Link href={`/clone/${s.token}/${e.sequence}`} className="underline decoration-dotted">#{e.sequence} {e.type}</Link> · {new Date(e.at).toLocaleString()} · {e.source} · {e.hash.slice(0, 12)}… ← {e.previous_hash.slice(0, 8)}…</li>)}
            </ol>
            <p className="mt-2 text-[0.8rem] text-ink-3">Each event&apos;s hash is sha256(previous hash + the event). <a href={`/api/v1/clone/${s.token}/verify`} className="underline">Recompute the chain</a> · <a href={`/api/v1/clone/${s.token}`} className="underline">JSON</a>{c ? <> · <a href={`/clone/${s.token}/clone.txt`} className="underline">clone.txt</a></> : null}</p>
          </details>
          <p className="text-[0.8rem] text-ink-3">Anyone with this address can open this clone. It holds only what the AI sent.{owner ? <> <button type="button" onClick={remove} className="underline hover:text-refuse">Delete this clone</button></> : null}</p>
          <p className="text-[0.75rem] text-ink-3">live: {live.current === "sse" ? "streaming" : live.current === "poll" ? "checking every 3 s" : "—"}</p>
        </section>
      )}
      {toast && <p role="status" className="toast glass-strong px-5 py-3 text-[0.92rem]">{toast}</p>}
    </div>
  );
}
