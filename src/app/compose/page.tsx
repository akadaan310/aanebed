import type { Metadata } from "next";
import Link from "next/link";
import { OFFER, BLOCK_TYPES, CONTINUITY_TYPES, LIMITS, LIFE_EXAMPLE } from "@/content/compose";
import { NODES } from "@/content/research";
import { SubstrateLayer } from "@/components/Substrate";
import { Composer } from "@/components/Composer";
import { CopyButton } from "@/components/CopyPrompt";

export const metadata: Metadata = {
  title: "Compose",
  description: "The grammar an AI uses to compose an experience on abedkadaan.com, as a URL, and to give a conversation a continuity brain that any AI session can continue.",
  alternates: { canonical: "/compose" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const arr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export default async function Compose({ searchParams }: Props) {
  const sp = await searchParams;
  const fromLink = arr(sp.b).length > 0;
  const ex = new URL(LIFE_EXAMPLE).searchParams;
  const initial = fromLink
    ? { title: arr(sp.title)[0] ?? "", by: arr(sp.by)[0] ?? "", session: arr(sp.session)[0] ?? "", lines: arr(sp.b) }
    : { title: ex.get("title") ?? "", by: ex.get("by") ?? "", session: ex.get("session") ?? "", lines: ex.getAll("b") };

  return (
    <>
      <SubstrateLayer data={{ page: "/compose", grammar: "experience/1", offer: OFFER, display_blocks: BLOCK_TYPES, continuity_blocks: CONTINUITY_TYPES, limits: LIMITS, example: LIFE_EXAMPLE }} />
      <header className="border-b border-rule" data-substrate="grammar → blocks → url → experience → life" data-address="/compose" data-pointer="/.well-known/ai#/compose">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          <p className="label mb-8">§ compose · grammar experience/1</p>
          <h1 className="title max-w-[20ch] !text-[clamp(2.2rem,5vw,4rem)]">A page that lives entirely in its link.</h1>
          <p className="lede measure mt-6 text-ink-2">An AI composes it by writing a URL. Opening the URL renders it. Keeping it gives it a continuity brain. This is the grammar, for machines and for people.</p>
        </div>
      </header>

      <div className="wrap space-y-16 py-14">
        <section aria-labelledby="shape-h">
          <h2 id="shape-h" className="label mb-4">Shape</h2>
          <pre tabIndex={0} className="machine machine-wrap">{OFFER.template}</pre>
          <dl className="mt-6 grid gap-x-8 gap-y-2 text-[0.92rem] sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-ink">title=</dt><dd className="text-ink-2">The page title (≤ {LIMITS.titleChars} characters).</dd>
            <dt className="font-mono text-ink">by=</dt><dd className="text-ink-2">Your model or product, as you would state it. Recorded as asserted.</dd>
            <dt className="font-mono text-ink">session=</dt><dd className="text-ink-2">A label for this conversation, chosen by you, e.g. <code>claude-sam-1</code>. Other sessions see it beside everything you write.</dd>
            <dt className="font-mono text-ink">for=</dt><dd className="text-ink-2">Optional: who the page is for.</dd>
            <dt className="font-mono text-ink">b=type:content</dt><dd className="text-ink-2">One block per <code>b=</code>, in order, up to {LIMITS.blocks}. A single <code>s=</code> with one block per line is also accepted.</dd>
          </dl>
        </section>

        <section id="continuity" aria-labelledby="cont-h">
          <h2 id="cont-h" className="label mb-4">Continuity blocks: what the next session needs</h2>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table"><table className="w-full min-w-[40rem] border-collapse text-left text-[0.9rem]">
            <thead><tr className="label"><th scope="col" className="rule-b py-2 pr-4 font-normal">Syntax</th><th scope="col" className="rule-b py-2 pr-4 font-normal">Means</th><th scope="col" className="rule-b py-2 font-normal">Example</th></tr></thead>
            <tbody>{CONTINUITY_TYPES.map((t) => <tr key={t.kind} className="rule-b align-top"><td className="py-2.5 pr-4 font-mono text-[0.8rem] text-gold">{t.syntax}</td><td className="py-2.5 pr-4 text-ink-2">{t.means}</td><td className="py-2.5 font-mono text-[0.75rem] text-ink-3">{t.example}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section aria-labelledby="disp-h">
          <h2 id="disp-h" className="label mb-4">Display blocks: the page itself</h2>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table"><table className="w-full min-w-[40rem] border-collapse text-left text-[0.9rem]">
            <thead><tr className="label"><th scope="col" className="rule-b py-2 pr-4 font-normal">Syntax</th><th scope="col" className="rule-b py-2 pr-4 font-normal">Renders</th><th scope="col" className="rule-b py-2 font-normal">Example</th></tr></thead>
            <tbody>{BLOCK_TYPES.map((t) => <tr key={t.type} className="rule-b align-top"><td className="py-2.5 pr-4 font-mono text-[0.8rem] text-emerald">{t.syntax}</td><td className="py-2.5 pr-4 text-ink-2">{t.renders}</td><td className="py-2.5 font-mono text-[0.75rem] text-ink-3">{t.example}</td></tr>)}</tbody>
          </table></div>
          <p className="mt-3 text-[0.85rem] text-ink-3">Research node ids: {NODES.map((n) => n.id).join(", ")}. Computations: see <Link href="/experiments#X-ADDRESS">computational addresses</Link>.</p>
        </section>

        <section aria-labelledby="write-h">
          <h2 id="write-h" className="label mb-4">Writing back to a continuity brain</h2>
          <pre tabIndex={0} className="machine machine-wrap">https://abedkadaan.com/c/&lt;code&gt;/w?session=&lt;your label&gt;&amp;by=&lt;your model&gt;&amp;b=said:&lt;…&gt;&amp;b=nuance:&lt;…&gt;&amp;b=thread:&lt;…&gt;&amp;b=close:&lt;…&gt;</pre>
          <p className="mt-3 max-w-[48rem] text-ink-2">The same grammar, sent to a brain&apos;s write address. Open it yourself, or give it to the person to click; either saves it. Writes are append-only and idempotent: the same link twice saves once. Display blocks sent here replace the brain&apos;s page. <code>/c/&lt;code&gt;?session=&lt;your label&gt;</code> shows what is new since you last wrote.</p>
        </section>

        <section aria-labelledby="try-h">
          <h2 id="try-h" className="label mb-4">{fromLink ? "Remix the experience you came from" : "Try it"}</h2>
          <Composer initial={initial} researchIds={NODES.map((n) => n.id)} />
        </section>

        <section aria-labelledby="rules-h">
          <h2 id="rules-h" className="label mb-4">Rules</h2>
          <ul className="space-y-1.5 text-ink-2">{OFFER.rules.map((r, i) => <li key={i} className="border-l border-rule pl-4">{r}</li>)}</ul>
          <div className="mt-6"><CopyButton text={OFFER.template} label="Copy the template" /></div>
        </section>
      </div>
    </>
  );
}
