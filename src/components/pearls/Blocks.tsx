"use client";

import { useState } from "react";
import type { Block } from "@/lib/pearls/model";

/** A Pearl's content, on paper. Quizzes play, cards flip, steps tick. Nothing here runs code from the Pearl. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return <div className="space-y-9">{blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>;
}

function Head({ text }: { text: string }) {
  return text ? <h2 className="mb-3 text-[1.35rem] leading-snug">{text}</h2> : null;
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "text": return <section><Head text={b.heading} /><div className="prose-pearl text-[1.08rem] leading-[1.7]">{b.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div></section>;
    case "list": return <section><Head text={b.heading} /><ul className="space-y-2 text-[1.05rem] leading-relaxed">{b.items.map((x, i) => <li key={i} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#a08c6c]" />{x}</li>)}</ul></section>;
    case "steps": return <Steps b={b} />;
    case "cards": return <Cards b={b} />;
    case "quiz": return <Quiz b={b} />;
  }
}

function Steps({ b }: { b: Extract<Block, { t: "steps" }> }) {
  const [done, setDone] = useState<boolean[]>(() => b.items.map(() => false));
  const n = done.filter(Boolean).length;
  return (
    <section>
      <Head text={b.heading} />
      <ol className="space-y-1.5">
        {b.items.map((x, i) => (
          <li key={i}>
            <label className="flex cursor-pointer gap-3 rounded-xl px-2 py-2 hover:bg-[#efe6d4]">
              <input type="checkbox" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} className="mt-1 h-5 w-5 shrink-0 accent-[#6f8f6f]" />
              <span className={`text-[1.05rem] leading-relaxed ${done[i] ? "text-[#85796a] line-through decoration-[#b3a68f]" : ""}`}><span className="mr-2 font-mono text-[0.8rem] text-[#85796a]">{i + 1}</span>{x}</span>
            </label>
          </li>
        ))}
      </ol>
      {n > 0 && <p className="muted mt-2 text-[0.85rem]" aria-live="polite">{n === b.items.length ? "All done." : `${n} of ${b.items.length} done`}</p>}
    </section>
  );
}

function Cards({ b }: { b: Extract<Block, { t: "cards" }> }) {
  const [i, setI] = useState(0), [on, setOn] = useState(false);
  const c = b.cards[i];
  const go = (d: number) => { setOn(false); setI((i + d + b.cards.length) % b.cards.length); };
  return (
    <section>
      <Head text={b.heading} />
      <button type="button" className="flip block w-full" data-on={on ? "1" : "0"} onClick={() => setOn(!on)} aria-label={on ? `Answer: ${c.back}. Tap to see the question.` : `Question: ${c.front}. Tap to see the answer.`}>
        <div className="flip-in">
          <div className="flip-face font-serif text-[1.2rem] leading-snug">{c.front}</div>
          <div className="flip-face flip-back text-[1.02rem] leading-relaxed">{c.back}</div>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between text-[0.9rem] muted">
        <button type="button" onClick={() => go(-1)} className="rounded-full px-3 py-2 hover:bg-[#efe6d4]" aria-label="Previous card">← Back</button>
        <span>{on ? "Answer" : "Tap the card"} · {i + 1} / {b.cards.length}</span>
        <button type="button" onClick={() => go(1)} className="rounded-full px-3 py-2 hover:bg-[#efe6d4]" aria-label="Next card">Next →</button>
      </div>
    </section>
  );
}

function Quiz({ b }: { b: Extract<Block, { t: "quiz" }> }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => b.questions.map(() => null));
  const [at, setAt] = useState(0);
  const score = picked.filter((p, i) => p === b.questions[i].answer).length;
  const finished = picked.every((p) => p !== null);
  const q = b.questions[at];
  const mine = picked[at];
  return (
    <section>
      <Head text={b.heading} />
      <div className="rounded-2xl border border-[#ddd1bb] bg-[#fbf6ec] p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-1.5" aria-hidden>{b.questions.map((qq, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${picked[i] === null ? "bg-[#e3d8c3]" : picked[i] === qq.answer ? "bg-[#7ea886]" : "bg-[#d09280]"} ${i === at ? "ring-2 ring-[#bba98a] ring-offset-1 ring-offset-[#fbf6ec]" : ""}`} />)}</div>
        <p className="font-serif text-[1.25rem] leading-snug">{q.q}</p>
        <div className="mt-4 grid gap-2">
          {q.options.map((o, i) => (
            <button key={i} type="button" className="opt" disabled={mine !== null} data-state={mine === null ? undefined : i === q.answer ? "right" : i === mine ? "wrong" : undefined} onClick={() => setPicked(picked.map((p, j) => (j === at ? i : p)))}>{o}</button>
          ))}
        </div>
        <div aria-live="polite" className="min-h-[1.5rem]">
          {mine !== null && <p className="mt-3 text-[0.95rem]">{mine === q.answer ? "Yes." : `Not quite — it's “${q.options[q.answer]}”.`} {q.why && <span className="muted">{q.why}</span>}</p>}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="muted text-[0.85rem]">{finished ? `${score} of ${b.questions.length} right` : `Question ${at + 1} of ${b.questions.length}`}</span>
          {mine !== null && at < b.questions.length - 1 && <button type="button" onClick={() => setAt(at + 1)} className="rounded-full bg-[#1e1a15] px-4 py-2 text-[0.9rem] text-[#f6f0e4]">Next question</button>}
          {finished && <button type="button" onClick={() => { setPicked(b.questions.map(() => null)); setAt(0); }} className="rounded-full border border-[#cdbfa6] px-4 py-2 text-[0.9rem]">Play again</button>}
        </div>
      </div>
    </section>
  );
}
