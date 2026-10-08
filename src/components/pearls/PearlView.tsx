"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Orb } from "./Orb";
import { Blocks } from "./Blocks";
import { Editor } from "./Editor";
import { keep, forget, isKept, readMine } from "@/lib/pearls/library";
import { encode } from "@/lib/pearls/codec";
import { forAI, fromReply, handLabel, idOf, look, modelName, toMarkdown, type Pearl } from "@/lib/pearls/model";

const KIND_WORD: Record<Pearl["kind"], string> = { idea: "An idea", game: "A game", study: "Something to learn", story: "A story", plan: "A plan", research: "Research", project: "A project", note: "A note" };
type Sheet = null | "keep" | "grow" | "give";
type Seal = "verified" | "unverified" | "none";

export function remember(p: Pearl, code: string) {
  const last = p.hands.at(-1);
  return keep({ id: idOf(p), code, title: p.title, kind: p.kind, essence: p.essence, from: p.from?.id ?? null, hands: p.hands.length, lastBy: last ? handLabel(last) : "", at: new Date().toISOString() });
}

export function PearlView({ pearl: p, code, origin, seal, born, ai }: { pearl: Pearl; code: string; origin: string; seal: Seal; born: string | null; ai: boolean }) {
  const router = useRouter();
  const id = idOf(p);
  const link = `${origin}/pearl/${code}`;
  const [kept, setKept] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [direction, setDirection] = useState("");
  const [ask, setAsk] = useState(p.next[0] ?? "");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<null | { label: string; t0: number }>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (born) remember(p, code);
    setKept(isKept(id));
    if (p.from) setParentCode(readMine().find((k) => k.id === p.from!.id)?.code ?? null);
  }, [born, code, id, p]);
  useEffect(() => { const d = dlg.current; if (!d) return; if (sheet && !d.open) d.showModal(); if (!sheet && d.open) d.close(); }, [sheet]);
  useEffect(() => { if (!busy) return; const t = setInterval(() => setSecs(Math.round((Date.now() - busy.t0) / 1000)), 500); return () => clearInterval(t); }, [busy]);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const copy = async (text: string, ok: string) => { try { await navigator.clipboard.writeText(text); say(ok); } catch { say("Couldn't copy. Select and copy it instead."); } };

  const toggleKeep = () => {
    if (kept) { setSheet("keep"); return; }
    if (remember(p, code)) { setKept(true); setSheet("keep"); } else say("This browser won't keep things right now (private mode?). Copy the link instead — it holds the whole Pearl.");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([toMarkdown(p, link)], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${p.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "pearl"}.md` });
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: p.title, text: p.essence || p.title, url: link }); return; } catch { /* closed */ } }
    await copy(link, "Link copied. Whoever opens it gets the whole Pearl.");
  };

  const goTo = async (next: Pearl, how: string) => {
    const c = await encode(next);
    remember(next, c);
    router.push(`/pearl/${c}?born=${how}`);
  };

  const grow = async (depth: "quick" | "deep") => {
    setErr(null); setSheet(null);
    setBusy({ label: depth === "deep" ? "Claude Sonnet 5.5 is reading your Pearl and growing it" : "Claude Haiku 5.5 is growing your Pearl", t0: Date.now() }); setSecs(0);
    try {
      const r = await fetch("/api/pearls/grow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, direction, depth }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "It couldn't grow just now.");
      remember(j.pearl, j.code);
      router.push(`/pearl/${j.code}?born=grown`);
    } catch (e) { setErr((e as Error).message); setBusy(null); }
  };

  const bringBack = async () => {
    const next = fromReply(reply, p);
    if (!next) { setErr("There's no Pearl in that reply yet. Ask your AI to end its answer with the ```pearl block from the copied text."); return; }
    setErr(null); setSheet(null); await goTo(next, "returned");
  };

  const last = p.hands.at(-1);
  const lk = look(p);

  if (editing) return <Editor pearl={p} onCancel={() => setEditing(false)} onSave={(next) => goTo(next, "edited")} />;

  return (
    <div className="room">
      <article className="mx-auto max-w-2xl px-4 pb-6 pt-10 sm:pt-14" aria-labelledby="pearl-title">
        <header className={`text-center ${born ? "born" : ""}`}>
          <div className="flex justify-center"><Orb look={lk} size={born ? 168 : 148} kept={kept} label={`The Pearl “${p.title}”: ${p.hands.length} ${p.hands.length === 1 ? "layer" : "layers"}${kept ? ", kept" : ""}.`} /></div>
          <p className="label mt-6 rise">{KIND_WORD[p.kind]}</p>
          <h1 id="pearl-title" className="headline mx-auto mt-3 max-w-[20ch] rise">{p.title}</h1>
          {p.essence && <p className="mx-auto mt-4 max-w-[46ch] font-serif text-[1.15rem] italic leading-relaxed text-[var(--iv2)] rise-2">{p.essence}</p>}
          <Strand p={p} seal={seal} parentCode={parentCode} />
          {born && <p className="mt-4 text-[0.95rem] text-[var(--warm)] rise-3" role="status">{born === "new" ? "It's yours. Keep it, grow it, or give it." : born === "grown" ? `Grown by ${modelName(last?.model)}. The Pearl it came from is unchanged.` : born === "returned" ? "Brought back. The Pearl it came from is unchanged." : "Saved as a new version. The earlier one is unchanged."}</p>}
        </header>

        {err && <p role="alert" className="mx-auto mt-8 max-w-xl rounded-2xl border border-[rgba(227,164,147,0.4)] bg-[rgba(227,164,147,0.08)] px-4 py-3 text-center text-[0.95rem] text-[var(--rose)]">{err}</p>}
        {busy && (
          <div className="forming mx-auto mt-8 flex max-w-xl items-center gap-4 rounded-2xl border border-[var(--line)] px-4 py-3" role="status" aria-live="polite">
            <Orb look={{ ...lk, layers: lk.layers + 1 }} size={44} />
            <p className="text-[0.95rem] text-[var(--iv2)]">{busy.label}… <span className="text-[var(--iv3)]">{secs}s</span></p>
          </div>
        )}

        <div className="paper mt-10 px-5 py-8 sm:px-10 sm:py-11 rise-2">
          <Blocks blocks={p.blocks} />
          {p.origin && (
            <figure className="mt-10 border-t border-[#ddd1bb] pt-6">
              <figcaption className="text-[0.72rem] uppercase tracking-[0.16em] text-[#85796a]">Where it began</figcaption>
              <blockquote className="mt-2 whitespace-pre-line font-serif text-[1rem] italic leading-relaxed text-[#574e42]">{p.origin.length > 600 ? p.origin.slice(0, 600) + "…" : p.origin}</blockquote>
            </figure>
          )}
        </div>

        <Inspect p={p} seal={seal} code={code} />
      </article>

      <nav aria-label="What to do with this Pearl" className="dock">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button type="button" className="verb" aria-pressed={kept} onClick={toggleKeep}><b>{kept ? "Kept" : "Keep"}</b><span>{kept ? "in My Pearls" : "so you can return"}</span></button>
          <button type="button" className="verb" onClick={() => { setErr(null); setSheet("grow"); }} disabled={!!busy}><b>Grow</b><span>continue it</span></button>
          <button type="button" className="verb" onClick={() => { setErr(null); setSheet("give"); }}><b>Give</b><span>to a person or AI</span></button>
        </div>
      </nav>

      <dialog ref={dlg} className="sheet" onClose={() => setSheet(null)} aria-labelledby="sheet-h">
        <div className="max-h-[86svh] overflow-y-auto px-5 pb-8 pt-5 sm:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="sheet-h" className="font-serif text-[1.6rem]">{sheet === "keep" ? "Kept" : sheet === "grow" ? "Grow it" : "Give it"}</h2>
            <button type="button" onClick={() => setSheet(null)} className="qbtn !min-h-9 !px-3 text-[0.85rem]" aria-label="Close">Close</button>
          </div>

          {sheet === "keep" && (
            <div className="space-y-5">
              <p className="text-[var(--iv2)]">It&apos;s in <Link href="/mine" className="underline">My Pearls</Link>, in this browser. The link holds the whole Pearl, so you can keep it anywhere else too.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="pbtn" onClick={() => copy(link, "Link copied. It holds the whole Pearl.")}>Copy its link</button>
                <button type="button" className="qbtn" onClick={download}>Download as a file</button>
              </div>
              <p className="text-[0.85rem] text-[var(--iv3)]">Pearls doesn&apos;t store your Pearls on a server: nothing to sign up for, nothing for us to lose. Clearing this browser&apos;s data removes it from My Pearls; the link still works.</p>
              <button type="button" className="text-[0.85rem] text-[var(--iv3)] underline" onClick={() => { forget(id); setKept(false); setSheet(null); say("Removed from My Pearls."); }}>Remove from My Pearls</button>
            </div>
          )}

          {sheet === "grow" && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[var(--iv2)]">Which way should it grow?</p>
                <div className="flex flex-wrap gap-2">{p.next.map((n) => <button key={n} type="button" className="seed" aria-pressed={direction === n} onClick={() => setDirection(n)}>{n}</button>)}</div>
                <label htmlFor="dir" className="sr-only">Or say how it should grow</label>
                <textarea id="dir" rows={2} value={direction} onChange={(e) => setDirection(e.target.value)} maxLength={400} placeholder="Or say it in your own words…" className="field mt-3 resize-none" />
              </div>
              {ai ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" className="pbtn" onClick={() => grow("deep")}>Grow with Claude Sonnet<span className="text-[0.78rem] opacity-70">· deeper</span></button>
                  <button type="button" className="qbtn !min-h-[3.25rem]" onClick={() => grow("quick")}>Grow with Claude Haiku<span className="text-[0.78rem] text-[var(--iv3)]">· quick</span></button>
                </div>
              ) : <p className="rounded-2xl border border-[var(--line)] px-4 py-3 text-[0.92rem] text-[var(--iv2)]">AI isn&apos;t switched on here right now. You can grow it yourself, or give it to your own AI.</p>}
              <p className="text-[0.82rem] text-[var(--iv3)]">{ai ? "A real model receives this exact Pearl and makes its next version. This one stays as it is, and the new one remembers where it came from." : ""}</p>
              <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                <button type="button" className="qbtn" onClick={() => { setSheet(null); setEditing(true); }}>Edit it yourself</button>
                <button type="button" className="qbtn" onClick={() => { if (direction) setAsk(direction); setSheet("give"); }}>Continue in your own AI</button>
              </div>
            </div>
          )}

          {sheet === "give" && (
            <div className="space-y-7">
              <section>
                <h3 className="label mb-2">To a person</h3>
                <p className="mb-3 text-[var(--iv2)]">Whoever opens the link gets the whole Pearl, and can keep it or grow their own version.</p>
                <button type="button" className="pbtn" onClick={share}>Share the link</button>
              </section>
              <section>
                <h3 className="label mb-2">To an AI</h3>
                <p className="mb-3 text-[var(--iv2)]">Paste it into ChatGPT, Claude, Gemini or any AI. It carries the whole Pearl, where it came from, and what you&apos;d like next. Not every AI can open links, so the text has everything.</p>
                <label htmlFor="ask" className="sr-only">What should the AI do with it?</label>
                <input id="ask" value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={300} placeholder="What should it do with it?" className="field mb-3" />
                <button type="button" className="qbtn" onClick={() => copy(forAI(p, link, ask), "Copied for AI. Paste it into any AI.")}>Copy for AI</button>
              </section>
              <section>
                <h3 className="label mb-2">Bring back what it made</h3>
                <label htmlFor="reply" className="mb-2 block text-[var(--iv2)]">Paste your AI&apos;s whole reply. Its new version becomes a Pearl that remembers this one.</label>
                <textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} spellCheck={false} placeholder="…```pearl { … } ```" className="field resize-y font-mono text-[0.82rem]" />
                <button type="button" className="qbtn mt-2" disabled={!reply.trim()} onClick={bringBack}>Bring it back</button>
              </section>
            </div>
          )}
          {err && sheet && <p role="alert" className="mt-4 text-[0.92rem] text-[var(--rose)]">{err}</p>}
        </div>
      </dialog>
      {toast && <p role="status" className="toast-p">{toast}</p>}
    </div>
  );
}

function Strand({ p, seal, parentCode }: { p: Pearl; seal: Seal; parentCode: string | null }) {
  const hands = p.hands.length > 4 ? [p.hands[0], ...p.hands.slice(-3)] : p.hands;
  return (
    <div className="mt-6 rise-2" aria-label="How this Pearl came to be">
      <ol className="strand">
        {hands.map((h, i) => {
          const isLast = h === p.hands.at(-1);
          return (
            <li key={i} className="flex flex-col items-center">
              {i > 0 && <span className="sep" aria-hidden />}
              <span className="flex items-center gap-2"><span className="bead" aria-hidden />
              <span>{handLabel(h)}{isLast && h.by === "model" ? (seal === "verified" ? <span className="ml-1 text-[var(--sage)]" title="Recorded by Pearls when the model made it"> ✓</span> : <span className="ml-1 text-[var(--iv3)]"> (not verifiable)</span>) : null}</span>
              {p.hands.length > 4 && i === 0 && <span className="text-[var(--iv3)]">· …</span>}</span>
            </li>
          );
        })}
      </ol>
      {p.from && <p className="mt-2 text-[0.82rem] text-[var(--iv3)]">Grown from {parentCode ? <Link href={`/pearl/${parentCode}`} className="underline">“{p.from.title}”</Link> : <>“{p.from.title}”</>}</p>}
    </div>
  );
}

function Inspect({ p, seal, code }: { p: Pearl; seal: Seal; code: string }) {
  const cls = (h: Pearl["hands"][number], last: boolean) =>
    h.by === "model" ? (last ? (seal === "verified" ? ["CAPTURED", "recorded by Pearls when the model answered; the model id is the one the API reported"] : ["UNVERIFIED", "the seal doesn't match this content: it was edited, or the key changed"]) : ["CARRIED", "recorded in an earlier version; carried forward"])
      : h.by === "another-ai" ? ["DECLARED", "what the other AI's reply said about itself; Pearls can't check it"]
      : h.by === "pearls" ? ["CAPTURED", "made by the Pearls team"]
      : ["CAPTURED", "your own action in this browser"];
  return (
    <details className="mx-auto mt-10 max-w-xl text-[0.88rem] text-[var(--iv2)]">
      <summary className="cursor-pointer text-center text-[var(--iv3)] hover:text-[var(--iv)]">Look closer</summary>
      <div className="mt-5 space-y-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[0.78rem]">
          <dt className="text-[var(--iv3)]">pearl</dt><dd>{idOf(p)} <span className="text-[var(--iv3)]">· derived: sha-256 of its content</span></dd>
          <dt className="text-[var(--iv3)]">link</dt><dd>{code.length} characters, holding everything <span className="text-[var(--iv3)]">· nothing is stored on a server</span></dd>
          <dt className="text-[var(--iv3)]">as text</dt><dd><a className="underline" href={`/pearl/${code}/text`}>/pearl/…/text</a> <span className="text-[var(--iv3)]">· for AIs and for reading</span></dd>
        </dl>
        <ol className="space-y-2">
          {p.hands.map((h, i) => { const [c, why] = cls(h, i === p.hands.length - 1); return (
            <li key={i} className="rounded-xl border border-[var(--line)] px-3 py-2">
              <span className="mr-2 font-mono text-[0.7rem] tracking-wider text-[var(--warm)]">{c}</span>{handLabel(h)} · {new Date(h.at).toLocaleString()}{h.model ? <span className="font-mono text-[0.75rem]"> · {h.model}</span> : null}
              {h.note && <p className="mt-1 text-[var(--iv3)]">“{h.note}”</p>}
              <p className="mt-0.5 text-[0.78rem] text-[var(--iv3)]">{why}</p>
            </li>); })}
        </ol>
        <p className="text-[0.82rem] text-[var(--iv3)]"><span className="mr-2 font-mono text-[0.7rem] tracking-wider text-[var(--warm)]">UNAVAILABLE</span>Any model&apos;s hidden instructions, private memory and internal reasoning. A Pearl holds only what was written into it.</p>
      </div>
    </details>
  );
}
