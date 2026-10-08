"use client";

import { useState } from "react";
import { FORMAT, idOf, normalize, type Block, type Pearl } from "@/lib/pearls/model";

/** Edit a Pearl by hand. Saving makes a new version that remembers this one; the original is never changed. */
export function Editor({ pearl: p, onCancel, onSave }: { pearl: Pearl; onCancel: () => void; onSave: (next: Pearl) => void }) {
  const [title, setTitle] = useState(p.title);
  const [essence, setEssence] = useState(p.essence);
  const [blocks, setBlocks] = useState<Block[]>(p.blocks);
  const [err, setErr] = useState<string | null>(null);

  const set = (i: number, b: Block) => setBlocks(blocks.map((x, j) => (j === i ? b : x)));
  const save = () => {
    const next = normalize({ ...p, format: FORMAT, title, essence, blocks, hands: [...p.hands, { by: "you", how: "edited", at: new Date().toISOString() }], from: { id: idOf(p), title: p.title } });
    if (!next) { setErr("A Pearl needs a title and at least one part with something in it."); return; }
    onSave(next);
  };

  return (
    <div className="room">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-10">
        <p className="label text-center">Editing — saving makes a new version; this one stays as it is</p>
        <div className="paper mt-6 space-y-6 px-5 py-7 sm:px-9">
          <label className="block"><span className="text-[0.75rem] uppercase tracking-[0.14em] text-[#85796a]">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} className="mt-1 w-full rounded-xl border border-[#d9cdb7] bg-[#fffaf1] px-3 py-2.5 font-serif text-[1.4rem] outline-none focus:border-[#a08c6c]" /></label>
          <label className="block"><span className="text-[0.75rem] uppercase tracking-[0.14em] text-[#85796a]">In one line</span>
            <input value={essence} onChange={(e) => setEssence(e.target.value)} maxLength={220} className="mt-1 w-full rounded-xl border border-[#d9cdb7] bg-[#fffaf1] px-3 py-2.5 italic outline-none focus:border-[#a08c6c]" /></label>
          {blocks.map((b, i) => (
            <fieldset key={i} className="rounded-2xl border border-[#e2d7c3] p-3">
              <legend className="px-1 text-[0.72rem] uppercase tracking-[0.14em] text-[#85796a]">{b.t === "text" ? "Writing" : b.t === "list" ? "List" : b.t === "steps" ? "Steps" : b.t === "cards" ? "Cards" : "Quiz"}</legend>
              <input value={b.heading} onChange={(e) => set(i, { ...b, heading: e.target.value })} placeholder="Heading (optional)" className="mb-2 w-full rounded-lg border border-[#e2d7c3] bg-[#fffaf1] px-3 py-2 font-serif outline-none focus:border-[#a08c6c]" />
              {b.t === "text" && <textarea value={b.body} rows={Math.min(14, Math.max(3, b.body.split("\n").length + 1))} onChange={(e) => set(i, { ...b, body: e.target.value })} className="w-full rounded-lg border border-[#e2d7c3] bg-[#fffaf1] px-3 py-2 leading-relaxed outline-none focus:border-[#a08c6c]" />}
              {(b.t === "list" || b.t === "steps") && <textarea value={b.items.join("\n")} rows={Math.max(3, b.items.length + 1)} onChange={(e) => set(i, { ...b, items: e.target.value.split("\n") })} aria-describedby={`hint${i}`} className="w-full rounded-lg border border-[#e2d7c3] bg-[#fffaf1] px-3 py-2 leading-relaxed outline-none focus:border-[#a08c6c]" />}
              {(b.t === "list" || b.t === "steps") && <p id={`hint${i}`} className="mt-1 text-[0.8rem] text-[#85796a]">One per line.</p>}
              {b.t === "cards" && b.cards.map((c, k) => (
                <div key={k} className="mb-2 grid gap-1 sm:grid-cols-2">
                  <input value={c.front} onChange={(e) => set(i, { ...b, cards: b.cards.map((x, j) => (j === k ? { ...x, front: e.target.value } : x)) })} aria-label={`Card ${k + 1} question`} className="rounded-lg border border-[#e2d7c3] bg-[#fffaf1] px-3 py-2 outline-none" />
                  <input value={c.back} onChange={(e) => set(i, { ...b, cards: b.cards.map((x, j) => (j === k ? { ...x, back: e.target.value } : x)) })} aria-label={`Card ${k + 1} answer`} className="rounded-lg border border-[#e2d7c3] bg-[#fffaf1] px-3 py-2 outline-none" />
                </div>
              ))}
              {b.t === "quiz" && <p className="text-[0.9rem] text-[#574e42]">{b.questions.length} questions. Quizzes are kept as they are here; ask an AI to change them.</p>}
              <button type="button" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="mt-2 text-[0.82rem] text-[#85796a] underline">Remove this part</button>
            </fieldset>
          ))}
          <button type="button" onClick={() => setBlocks([...blocks, { t: "text", heading: "", body: "" }])} className="rounded-full border border-[#cdbfa6] px-4 py-2 text-[0.9rem]">Add some writing</button>
        </div>
        {err && <p role="alert" className="mt-4 text-center text-[var(--rose)]">{err}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="pbtn" onClick={save}>Save as a new version</button>
          <button type="button" className="qbtn !min-h-[3.25rem]" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
