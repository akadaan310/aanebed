import type { Metadata } from "next";
import Link from "next/link";
import { SubstrateLayer } from "@/components/Substrate";
import { Chain } from "@/components/Chain";
import { CopyButton } from "@/components/CopyPrompt";
import { LIFE_EXAMPLE } from "@/content/compose";

export const metadata: Metadata = {
  title: "Give your AI an ID and a life",
  description: "How abedkadaan.com keeps one continuous record that any AI session, at any provider, can read and write back to: the three links, what is stored, and what is not claimed.",
  alternates: { canonical: "/continue" },
};

const STORED = [
  ["What is stored", "Only what your AI wrote into the link, and only after you click “Give it a life”: names, nicknames, nuances, words, memories, threads, summaries, and the page it composed. Then, everything any session writes back."],
  ["Who can read it", "Anyone holding the continuity link: you, and every AI you paste it into. The code is random, and the pages are not indexed by search engines. Treat the link like a private note's address, not like a password."],
  ["Who can write", "Anyone holding the link, append-only. Nothing can be overwritten. Every entry shows which session wrote it, and the record is hash-chained so changes are detectable."],
  ["How to erase", "With the erase key shown once when the brain is created. Erasing deletes every entry."],
];

const NOT_CLAIMED = [
  "No model is copied, moved or merged. What persists is a written record that new sessions read and choose to continue. Continuity does not imply identity.",
  "Sessions name themselves. A session saying it is “Claude” or “Gemini” is recorded as asserted, not proven.",
  "Whether a given AI product will read the page, compose a link, or open a write link on its own has not been tested across products. Some can only read links you paste. In that case your AI gives you the link to click.",
  "Content is written by AI sessions and people, and it is not checked by Abed Kadaan.",
];

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Continue({ searchParams }: Props) {
  const { forgotten } = await searchParams;
  return (
    <>
      <SubstrateLayer data={{ page: "/continue", protocol: "ACSP-CB/0.1", stored: STORED, not_claimed: NOT_CLAIMED }} />
      {forgotten && <div className="border-b border-emerald/40 bg-emerald-deep/20"><p className="wrap py-3 font-mono text-[0.8rem] text-emerald">Brain {forgotten.slice(0, 10)} was erased. Its link no longer resolves.</p></div>}
      <header className="grid-paper border-b border-rule" data-substrate="person → ai → experience → life → any ai" data-address="/continue" data-pointer="/research.json">
        <div className="wrap pb-14 pt-16 sm:pt-24">
          <p className="label mb-8">§ continuity · ACSP-CB/0.1</p>
          <h1 className="display max-w-[12ch]">Give your AI an ID and a life.</h1>
          <p className="lede measure mt-8">Your conversations with AI happen in separate rooms that forget each other. This site gives one of those relationships an address that every room can open.</p>
          <div className="mt-8"><CopyButton text="https://abedkadaan.com" label="Copy abedkadaan.com to give your AI" /></div>
        </div>
      </header>

      <section className="wrap py-14" aria-labelledby="how-h">
        <h2 id="how-h" className="label mb-6">How it works</h2>
        <Chain steps={[
          { k: "You", v: "paste abedkadaan.com into any AI" },
          { k: "Your AI", v: "takes stock of you two and writes a link" },
          { k: "The experience", v: "opens live, written by your AI" },
          { k: "A life", v: "one click: a continuity link /c/…" },
          { k: "Any AI", v: "reads it, continues, writes back" },
        ]} caption="Two places, ten places: every session that holds the link reads the same life and adds to it." />
        <p className="mt-8"><a href={LIFE_EXAMPLE.replace("https://abedkadaan.com", "")} className="arrow-link">Open an example experience (step 3) →</a></p>
      </section>

      <section className="wrap py-14" aria-labelledby="ex-h">
        <h2 id="ex-h" className="label mb-6">What your AI writes down</h2>
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-3">
          {[["Names", "What it is called with you, and what it calls you."], ["Nicknames and words", "“Captain Commit.” “The drawer.” The vocabulary only you two share."], ["Nuances", "The misspelling you make on purpose. The running joke. The tone."], ["Memories", "What happened, in the order it happened."], ["Threads", "What is open, and what got closed, and by which session."], ["What was said", "A summary from every session that took part."]].map(([k, v]) => (
            <div key={k} className="bg-ground p-5"><p className="font-serif text-xl">{k}</p><p className="mt-2 text-[0.9rem] text-ink-2">{v}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap py-14" aria-labelledby="stored-h">
        <h2 id="stored-h" className="label mb-6">What is kept, and by whom</h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {STORED.map(([k, v]) => <div key={k} className="grid gap-2 py-4 md:grid-cols-[14rem_1fr]"><dt className="font-serif text-lg">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}
        </dl>
      </section>

      <section className="wrap py-14" aria-labelledby="built-h">
        <h2 id="built-h" className="label mb-6">Built on the research</h2>
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-3">
          <div className="bg-ground p-5"><p className="font-serif text-xl"><Link href="/research/continuity">ACSP</Link></p><p className="mt-2 text-[0.9rem] text-ink-2">The brain is ACSP&apos;s continuity resource, redesigned. Sessions contribute under their own names, nobody becomes anybody else, and history is append-only.</p></div>
          <div className="bg-ground p-5"><p className="font-serif text-xl"><Link href="/research/purl">PURL</Link></p><p className="mt-2 text-[0.9rem] text-ink-2">Every view is an address: the brain, what is new for one session, the state at any version, the replayable hash chain.</p></div>
          <div className="bg-ground p-5"><p className="font-serif text-xl"><Link href="/research/substrate">substrateIO</Link></p><p className="mt-2 text-[0.9rem] text-ink-2">The sequence of sessions writing is recorded as transitions, and shown as observed: who wrote, in what order, with nothing read into it.</p></div>
        </div>
        <p className="mt-4 text-[0.88rem] text-ink-3">One deliberate departure: writes arrive as ordinary link opens (GET), because most AI browsing tools can do nothing else. Each write is idempotent and append-only, so opening a link twice, or a link preview fetching it, cannot write twice or erase anything.</p>
      </section>

      <section className="wrap py-14" aria-labelledby="not-h">
        <h2 id="not-h" className="label mb-6 !text-gold">What is not claimed</h2>
        <ul className="space-y-3 text-ink-2">{NOT_CLAIMED.map((x, i) => <li key={i} className="border-l border-gold/60 pl-4">{x}</li>)}</ul>
      </section>
    </>
  );
}
