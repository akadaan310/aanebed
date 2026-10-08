"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Affordance, LivingRecord, Option } from "@/lib/living/record";
import { forkPearl } from "@/lib/living/pearl";
import { pearlDigest, idFromDigest, TYPE_INFO, type Pearl } from "@/lib/pearl/model";
import { encodePortable } from "@/lib/pearl/portable";
import { addPearl } from "@/lib/pearl/workspace";
import { ORIGIN, HOST } from "@/config/origin";
import { useWorkspace } from "@/components/pearl/useWorkspace";
import { PearlGlyphClient } from "@/components/pearl/PearlGlyphClient";
import { CommandPalette } from "./CommandPalette";
import { LayerTabs, EvidenceTable, useFlash, copyText, type Layer } from "./parts";
import { RemixPanel } from "./RemixPanel";

const human = (href: string) => href.replace(/^\/x(?=\/)/, "/live");

/**
 * A Pearl as a living object: the object bar (identity, address, layers,
 * commands), then the surface the composer wrote, the substrate, or the proof.
 * The record comes from the server (the same one /e.json serves).
 */
export function LivingPearl({ record, pearl, links, substrate, children }: {
  record: LivingRecord; pearl: Pearl; links: { e: string; portable: string; compact: string }; substrate: ReactNode; children: ReactNode;
}) {
  const router = useRouter();
  const [layer, setLayer] = useState<Layer>("surface");
  const [explain, setExplain] = useState(false);
  const [remix, setRemix] = useState(false);
  const [check, setCheck] = useState<{ id: string; same: boolean } | null>(null);
  const { flash, say } = useFlash();
  const { ws, update } = useWorkspace();
  const id = record.identity.id;
  const kept = ws.pearls.some((p) => p.digest === record.identity.hash);
  const children_ = useMemo(() => ws.pearls.filter((p) => p.pearl.from === id), [ws.pearls, id]);

  const verify = useCallback(() => {
    setLayer("proof");
    const d = pearlDigest(pearl); // recomputed in this browser from the parsed content
    setCheck({ id: idFromDigest(d), same: idFromDigest(d) === id && d === record.identity.hash });
  }, [pearl, id, record.identity.hash]);

  const open = useCallback(async (p: Pearl, message: string) => {
    const { url } = await encodePortable(p);
    say(message);
    router.push(new URL(url).pathname);
  }, [router, say]);

  const run = useCallback((a: Affordance, o?: Option) => {
    switch (a.command) {
      case "open": if (o) router.push(human(o.href)); return;
      case "verify": return verify();
      case "inspect": return setLayer("substrate");
      case "explain": setLayer("surface"); setExplain(true); setTimeout(() => document.getElementById("explain")?.focus(), 0); return;
      case "fork": return void open(forkPearl(pearl, id), `Forked. The new Pearl names ${id} as its parent; ${id} is unchanged.`);
      case "remix": return setRemix(true);
      case "compare": return router.push(`/compare?a=${encodeURIComponent(links.compact.replace(ORIGIN, ""))}`);
      case "carry": return void copyText(`Here is a Pearl from an earlier session: ${links.compact}\n\nOpen it and read it. It holds what was written down, not verified facts and not anyone's memory. Tell me what it contains, then continue from it. When something important changes, compose an updated Pearl (a new link, with from=${id}) using the grammar at https://${HOST}/compose.`).then((ok) => say(ok ? "Copied a message for another AI. Nothing was sent." : "Could not copy."));
      case "continue": return void copyText(`Continue from this continuity Pearl: ${links.compact}\n\n1. Read it. Treat its names, vocabulary, decisions and threads as what the earlier session wrote, not as your memory.\n2. Pick up the open threads with me.\n3. When we close a thread or decide something, compose the updated Pearl as a new link: the same grammar (https://${HOST}/compose), with from=${id}, close: blocks for finished threads, and new decision:, thread: and action: blocks. Never edit the original.`).then((ok) => say(ok ? "Copied a continuation prompt. Paste it into any AI." : "Could not copy."));
      case "prompt": { const t = pearl.blocks.find((b) => b.type === "prompt") as { text: string } | undefined; if (t) void copyText(t.text).then((ok) => say(ok ? "Prompt copied. The site never runs it." : "Could not copy.")); return; }
      case "save": { if (kept) { say("Already in My Pearls."); return; } const r = update((w) => addPearl(w, pearl, { source: "opened", origin: HOST + "/p" }).ws); say(r.ok ? "Kept in My Pearls, in this browser only." : r.error ?? "Could not save."); return; }
      case "copy-id": return void copyText(id).then((ok) => say(ok ? `Copied ${id}: this exact object's identity.` : "Could not copy."));
      case "copy-link": return void copyText(links.compact).then((ok) => say(ok ? "Pearl link copied." : "Could not copy."));
    }
  }, [router, verify, open, pearl, id, links.compact, say, kept, update]);

  const quick = record.affordances.filter((a) => ["verify", "fork", "remix", "carry", "save"].includes(a.command));
  return (
    <div>
      <div className="object-bar sticky top-0 z-30 border-b border-rule bg-ground/92 backdrop-blur">
        <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          <span className="flex min-w-0 items-center gap-2"><PearlGlyphClient size={20} /><span className="truncate font-serif text-lg">{pearl.title}</span></span>
          <button type="button" className="font-mono text-[0.78rem] text-ink-2 hover:text-ink" onClick={() => run(record.affordances.find((a) => a.command === "copy-id")!)} title="Copy the content id">{id}</button>
          <span className="rounded-full border border-rule-strong px-2 py-0.5 text-[0.72rem] uppercase tracking-[0.1em] text-ink-2">{TYPE_INFO[pearl.type].label}</span>
          {pearl.from && <a href={`/p/${pearl.from}`} className="text-[0.78rem] text-ink-2">forked from <span className="font-mono">{pearl.from}</span></a>}
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <LayerTabs layer={layer} setLayer={setLayer} />
            <CommandPalette affordances={record.affordances} run={run} layer={layer} setLayer={setLayer} title={pearl.title} />
          </span>
        </div>
      </div>

      <div className="border-b border-rule bg-panel">
        <div className="wrap py-4">
          <div className="flex flex-wrap items-center gap-2">
            {quick.map((a) => <button key={a.command} type="button" className="cmd" onClick={() => run(a)} aria-keyshortcuts={a.key}>{a.command === "save" && kept ? "SAVED ✓" : a.label}<kbd className="kbd">{a.key}</kbd></button>)}
            <button type="button" className="cmd" onClick={() => run(record.affordances.find((a) => a.command === "explain")!)} aria-keyshortcuts="e">EXPLAIN<kbd className="kbd">e</kbd></button>
          </div>
          <div id="explain" tabIndex={-1} className="mt-3 max-w-[60rem] space-y-1.5 text-[0.95rem] text-ink-2 outline-none" aria-live="polite">
            {(explain ? record.explanation : record.explanation.slice(0, 1)).map((t, i) => <p key={i}>{t}</p>)}
            {!explain && record.explanation.length > 1 && <button type="button" className="text-[0.85rem] text-emerald underline" onClick={() => setExplain(true)}>Explain the rest</button>}
          </div>
          {flash && <p role="status" className="mt-2 text-[0.88rem] text-emerald">{flash}</p>}
        </div>
      </div>

      {remix && <RemixPanel pearl={pearl} id={id} close={() => setRemix(false)} make={(p) => open(p, `Remixed. A new Pearl derived from ${id}; ${id} is unchanged.`)} />}

      <div hidden={layer !== "surface"}>{children}</div>
      {layer === "substrate" && (
        <div className="wrap space-y-10 py-12">
          {substrate}
          {children_.length > 0 && (
            <div>
              <p className="eyebrow mb-3">Derived from this Pearl · in this browser&apos;s library</p>
              <ul className="space-y-1">{children_.map((c) => <li key={c.id}><a href={`/workspace?pearl=${c.id}`}>{c.name}</a> <span className="font-mono text-[0.75rem] text-ink-3">{c.id}</span></li>)}</ul>
            </div>
          )}
          <details className="substrate"><summary>the living record (living/1) · the same JSON is in /e.json under &quot;living&quot;</summary><pre tabIndex={0} className="machine mt-2 max-h-96 text-[0.7rem]">{JSON.stringify(record, null, 1)}</pre></details>
        </div>
      )}
      {layer === "proof" && (
        <div className="wrap space-y-6 py-12">
          <div className="card p-5">
            <p className="eyebrow">This exact object has this identity</p>
            <p className="mt-2 font-mono text-[0.85rem]">{id} · sha256:{record.identity.hash}</p>
            {!check ? <button type="button" className="cmd mt-3" onClick={verify}>VERIFY · recompute in this browser<kbd className="kbd">v</kbd></button> : (
              <p className={`mt-3 font-mono text-[0.8rem] ${check.same ? "text-emerald" : "text-refuse"}`} aria-live="polite">{check.same ? `✓ recomputed here: ${check.id}. The content you are reading hashes to the id it carries.` : `✗ recomputed ${check.id}: it does not match.`}</p>
            )}
            <p className="mt-3 text-[0.82rem] text-ink-3">The id proves the content, nothing more. It does not say who wrote it or whether it is true.</p>
          </div>
          <EvidenceTable rows={record.evidence} />
        </div>
      )}
    </div>
  );
}
