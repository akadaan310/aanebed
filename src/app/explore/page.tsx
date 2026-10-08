import type { Metadata } from "next";
import Link from "next/link";
import { Row } from "@/components/pearls/Row";
import { SubstrateLayer } from "@/components/Substrate";
import { encode, decode } from "@/lib/pearls/codec";
import { EXAMPLES, MADE_BY_MODELS } from "@/content/pearls";

export const metadata: Metadata = { title: "Explore", description: "Pearls people and AIs have made: games, study cards, stories, plans, research and ideas for small businesses.", alternates: { canonical: "/explore" } };

export default async function Explore() {
  const examples = await Promise.all(EXAMPLES.map(async (p) => ({ p, code: await encode(p) })));
  const real = (await Promise.all(MADE_BY_MODELS.map(async (m) => ({ p: await decode(m.code), code: m.code, story: m.story })))).filter((x) => x.p);
  return (
    <div className="room px-4 pb-24 pt-14">
      <SubstrateLayer data={{ page: "/explore", pearls: examples.map((x) => `/pearl/${x.code}`).length }} />
      <div className="mx-auto max-w-3xl">
        <h1 className="display max-w-[12ch]">Explore</h1>
        <p className="mt-4 max-w-[48ch] text-[1.1rem] text-[var(--iv2)]">Open any of these, play it, keep it, or grow your own version. Each one lives entirely in its link.</p>
        {real.length > 0 && (
          <section className="mt-14" aria-labelledby="real-h">
            <h2 id="real-h" className="label">Passed between real models on this site</h2>
            <div className="mt-3 divide-y divide-[var(--line)]">{real.map((x) => <Row key={x.code} p={x.p!} code={x.code} note={x.story} />)}</div>
          </section>
        )}
        <section className="mt-14" aria-labelledby="ex-h">
          <h2 id="ex-h" className="label">Examples from the Pearls team</h2>
          <div className="mt-3 divide-y divide-[var(--line)]">{examples.map(({ p, code }) => <Row key={code} p={p} code={code} />)}</div>
        </section>
        <p className="mt-16 text-center"><Link href="/" className="pbtn">Make your own</Link></p>
      </div>
    </div>
  );
}
