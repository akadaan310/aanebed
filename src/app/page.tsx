import { Maker } from "@/components/pearls/Maker";
import { Orb, UNFORMED } from "@/components/pearls/Orb";
import { Row } from "@/components/pearls/Row";
import { aiAvailable } from "@/lib/pearls/ai";
import { encode } from "@/lib/pearls/codec";
import { EXAMPLES } from "@/content/pearls";
import Link from "next/link";
import { SubstrateLayer } from "@/components/Substrate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await Promise.all(EXAMPLES.slice(0, 3).map(async (p) => ({ p, code: await encode(p) })));
  return (
    <div className="room">
      <SubstrateLayer data={{ page: "/", product: "Pearls", action: "make a Pearl", api: { shape: "POST /api/pearls/shape {text}", grow: "POST /api/pearls/grow {code, direction, depth}" }, pearl: { open: "/pearl/{code}", text: "/pearl/{code}/text", format: "pearls/1" }, machine: ["/llms.txt", "/.well-known/ai", "/capabilities.json"] }} />
      <section className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-4 pb-16 pt-12 text-center" aria-labelledby="h">
        <div className="rise opacity-90"><Orb look={UNFORMED} size={84} /></div>
        <h1 id="h" className="display mt-7 max-w-[13ch] rise">Make something worth keeping.</h1>
        <p className="mt-5 max-w-[34ch] text-[clamp(1.05rem,3.4vw,1.3rem)] text-[var(--iv2)] rise-2">Ideas become Pearls. Pearls can go places.</p>
        <Maker ai={aiAvailable()} />
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20" aria-labelledby="verbs-h">
        <div className="mx-auto max-w-4xl">
          <h2 id="verbs-h" className="headline max-w-[18ch]">A Pearl is something you made. Then it goes on.</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              ["Keep", "It stays yours: in My Pearls, as a file, or simply as its link — the link holds the whole thing."],
              ["Grow", "Continue it with Claude, by hand, or with your own AI. Each new version remembers the one it came from."],
              ["Give", "Send it to a friend, or copy it for any AI. It travels with where it came from and what you'd like next."],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-serif text-[1.7rem]">{k}</p>
                <p className="mt-2 leading-relaxed text-[var(--iv2)]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20" aria-labelledby="made-h">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <h2 id="made-h" className="headline">Some Pearls</h2>
            <Link href="/explore" className="qbtn">Explore</Link>
          </div>
          <div className="mt-8 divide-y divide-[var(--line)]">{featured.map(({ p, code }) => <Row key={code} p={p} code={code} />)}</div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-20" aria-labelledby="org-h">
        <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-2">
          <div>
            <h2 id="org-h" className="font-serif text-[1.7rem] leading-tight">The same thing, for teams and services.</h2>
            <p className="mt-3 leading-relaxed text-[var(--iv2)]">What lets one person keep and continue a piece of work lets an agency hand a brief from one AI to another, a research group keep a finding with its history, a shop give each customer a card any AI can read, or a website offer AI work a permanent address. <Link href="/explore" className="underline">See the bakery example</Link>.</p>
          </div>
          <div>
            <h2 className="font-serif text-[1.7rem] leading-tight">An open question.</h2>
            <p className="mt-3 leading-relaxed text-[var(--iv2)]">What can a small model do when its continuity lives outside the model — in a Pearl it can be handed, rather than in what it remembers? From a few million parameters to a billion, nobody here has measured it yet. Keeping context outside a model is not the same as making it smarter; that is the question, not the claim. <Link href="/research" className="underline">The research downstairs</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
