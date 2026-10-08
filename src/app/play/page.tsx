import type { Metadata } from "next";
import Link from "next/link";
import { Row } from "@/components/pearls/Row";
import { SubstrateLayer } from "@/components/Substrate";
import { encode } from "@/lib/pearls/codec";
import { EXAMPLES, PLAYABLE } from "@/content/pearls";

export const metadata: Metadata = { title: "Play", description: "Pearls you can play: games, quizzes and flashcards, and a few small worlds that live in a link.", alternates: { canonical: "/play" } };

const WORLDS = [
  { href: "/g/ttt", title: "Noughts and crosses, by link", line: "Every move is a new link. Send your move to a friend — or to an AI — and they answer with theirs." },
  { href: "/x/map/eca/90/8/state/5", title: "A universe in an address", line: "A tiny cellular universe. Change the rule in the link and a different world unfolds, the same for everyone who opens it." },
];

export default async function Play() {
  const games = await Promise.all(EXAMPLES.filter((p) => PLAYABLE.includes(p.title)).map(async (p) => ({ p, code: await encode(p) })));
  return (
    <div className="room px-4 pb-24 pt-14">
      <SubstrateLayer data={{ page: "/play", worlds: WORLDS.map((w) => w.href) }} />
      <div className="mx-auto max-w-3xl">
        <h1 className="display max-w-[12ch]">Play</h1>
        <p className="mt-4 max-w-[48ch] text-[1.1rem] text-[var(--iv2)]">Some Pearls are meant to be played. Ask for a game or a quiz when you make one, and yours will be too.</p>
        <section className="mt-14" aria-labelledby="g-h">
          <h2 id="g-h" className="label">Pearls to play</h2>
          <div className="mt-3 divide-y divide-[var(--line)]">{games.map(({ p, code }) => <Row key={code} p={p} code={code} />)}</div>
        </section>
        <section className="mt-14" aria-labelledby="w-h">
          <h2 id="w-h" className="label">Small worlds in a link</h2>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {WORLDS.map((w) => (
              <li key={w.href}><Link href={w.href} className="block rounded-3xl px-4 py-5 no-underline transition hover:bg-[rgba(242,234,219,0.04)]">
                <span className="block font-serif text-[1.3rem]">{w.title} <span aria-hidden className="text-[var(--iv3)]">→</span></span>
                <span className="mt-1 block text-[0.92rem] text-[var(--iv2)]">{w.line}</span>
              </Link></li>
            ))}
          </ul>
        </section>
        <p className="mt-16 text-center"><Link href="/" className="pbtn">Make a game of your own</Link></p>
      </div>
    </div>
  );
}
