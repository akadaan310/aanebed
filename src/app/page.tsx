import Link from "next/link";
import { TinyWorld } from "@/components/v6/TinyWorld";
import { YouWereHere, MakeBox } from "@/components/v6/Home";
import { BringBack } from "@/components/v6/Actions";
import { SubstrateLayer } from "@/components/Substrate";
import { OFFER, LIFE_EXAMPLE } from "@/content/compose";
import { deciderPearls, EXAMPLE_PASS } from "@/content/world";
import { parseExperience } from "@/lib/experience";
import { toPearl } from "@/lib/pearl/model";
import { encodePortable } from "@/lib/pearl/portable";
import { RESEARCH_IDS } from "@/lib/pearl/resolve";
import { ORIGIN } from "@/config/origin";

/** A tile's little picture: drawn, never an image file. */
function Visual({ kind }: { kind: string }) {
  if (kind === "board") return <div aria-hidden="true" className="grid h-24 w-24 grid-cols-3 gap-1">{"X O · X · O · · X".split(" ").map((c, i) => <span key={i} className="grid place-items-center rounded-md bg-white/5 font-serif text-lg text-ink">{c === "·" ? "" : c}</span>)}</div>;
  if (kind === "clock") return <div aria-hidden="true" className="flex h-24 items-center gap-1">{[1, 0, 1, 1, 0, 0, 1, 0].map((b, i) => <span key={i} className="block h-12 w-3 rounded-full" style={{ background: b ? "hsl(210 80% 72%)" : "rgb(255 255 255 / 0.08)", boxShadow: b ? "0 0 14px hsl(210 80% 60% / 0.7)" : "none" }} />)}</div>;
  if (kind === "loom") return <div aria-hidden="true" className="grid h-24 w-24 grid-cols-6 gap-0.5">{Array.from({ length: 36 }, (_, i) => <span key={i} className="rounded-sm" style={{ background: (i * 7 + (i >> 2)) % 3 === 0 ? `hsl(${300 + i * 2} 70% 70%)` : "transparent" }} />)}</div>;
  if (kind === "talk") return <div aria-hidden="true" className="flex h-24 flex-col justify-center gap-1.5"><span className="h-3 w-20 rounded-full bg-white/30" /><span className="ml-6 h-3 w-16 rounded-full bg-emerald/70" /><span className="h-3 w-24 rounded-full bg-white/30" /></div>;
  if (kind === "pass") return <div aria-hidden="true" className="flex h-24 items-center gap-1.5">{["you", "A", "B", "you"].map((w, i) => <span key={i} className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-[0.7rem] text-ink-2">{w}</span>)}</div>;
  return <div aria-hidden="true" className="orb orb-float h-20 w-20" />;
}

interface Tile { title: string; line: string; href: string; visual: string }
function Zone({ id, name, sub, tiles }: { id: string; name: string; sub: string; tiles: Tile[] }) {
  return (
    <section aria-labelledby={`zone-${id}`} className="mt-16 first:mt-0">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1"><h3 id={`zone-${id}`} className="zone-title">{name}</h3><p className="text-[0.9rem] text-ink-3">{sub}</p></div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="glass pearl-tile h-full p-6">
              <Visual kind={t.visual} />
              <span className="mt-5 block font-serif text-[1.6rem] leading-tight">{t.title}</span>
              <span className="mt-1.5 block text-[0.95rem] text-ink-2">{t.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const decider = await deciderPearls();
  const talk = toPearl(parseExperience(LIFE_EXAMPLE.slice(LIFE_EXAMPLE.indexOf("?") + 1), new Set(RESEARCH_IDS)).doc);
  const talkPath = new URL((await encodePortable(talk)).url).pathname;

  return (
    <>
      <SubstrateLayer data={{ page: "/", product: "Pearls — a place where people and AIs make things that have addresses", loop: ["discover", "open", "interact", "create", "pearl", "copy url", "copy for ai", "ai participates", "bring back", "continue"], experiences: ["/live", "/g/ttt", "/clock", "/loom", talkPath.slice(0, 40) + "…", decider.root.path.slice(0, 40) + "…", "/report", "/garden"], machine: ["/llms.txt", "/.well-known/ai", "/capabilities.json", "/research.json"], substrate_status: "/api/substrate/status" }} />

      {/* Come here */}
      <section aria-labelledby="hero-h" className="overflow-hidden">
        <div className="wrap grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
          <div>
            <YouWereHere />
            <h1 id="hero-h" className="mt-6 font-serif text-[clamp(3.6rem,11vw,8.5rem)] leading-[0.92] tracking-[-0.03em]">Come here.</h1>
            <p className="mt-8 max-w-[30ch] text-[clamp(1.2rem,2.2vw,1.55rem)] leading-snug text-ink-2">Things you make can become things you keep. <span className="text-ink">Give them to your AI.</span> <span className="text-ink">Bring them back.</span></p>
            <div className="mt-10 flex flex-wrap gap-3"><a href="#make" className="btn-glow">Make something</a><a href="#more" className="btn-glass">Want another?</a></div>
          </div>
          <div className="glass p-6 sm:p-8">
            <p className="zone-title text-center">Here. Touch this.</p>
            <div className="mt-4"><TinyWorld /></div>
          </div>
        </div>
      </section>

      {/* The park */}
      <section id="more" aria-labelledby="more-h" className="scroll-mt-16 border-t border-white/10">
        <div className="wrap py-16 sm:py-24">
          <h2 id="more-h" className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-tight">Want another?</h2>
          <p className="mt-3 max-w-[46ch] text-[1.1rem] text-ink-2">Every one of these is a link. Open it, play with it, keep it, or give it to your AI.</p>
          <div className="mt-12">
            <Zone id="play" name="Play" sub="Games you can pass between AIs." tiles={[{ title: "A game for two AIs", line: "Noughts and crosses where the link is the whole game. Make a move, then give it to an AI.", href: "/g/ttt", visual: "board" }, { title: "Pass it on", line: "See a game that went from you, to one AI, to another, and back.", href: EXAMPLE_PASS, visual: "pass" }]} />
            <Zone id="strange" name="Strange" sub="Small worlds with their own rules." tiles={[{ title: "A strange clock", line: "Lights that keep their own time, forever.", href: "/clock", visual: "clock" }, { title: "A pattern loom", line: "One rule weaves a whole cloth. Change one thread.", href: "/loom", visual: "loom" }, { title: "A tiny world", line: "Eight lights on a ring. Touch one and see what follows.", href: "/live/map/eca/90/8/state/5", visual: "orb" }]} />
            <Zone id="ai" name="With AI" sub="Made with an AI, or made to be given to one." tiles={[{ title: "A conversation you can carry", line: "What one AI wrote down so the next can pick up where it left off.", href: talkPath, visual: "talk" }, { title: "A two-minute decider", line: "A small tool an AI made. One honest question; each answer is its own Pearl.", href: decider.root.path, visual: "orb" }]} />
            <Zone id="useful" name="Useful" sub="Things that help." tiles={[{ title: "Make a study card, a recipe, a plan", line: "Fill in a few lines; it becomes a Pearl you can carry.", href: "/create", visual: "talk" }, { title: "Something wrong?", line: "Tell us what happened. Your report becomes a Pearl an AI can diagnose.", href: "/report", visual: "orb" }]} />
            <Zone id="you" name="Continuity" sub="Everything you touch can grow into a garden." tiles={[{ title: "Your Pearls", line: "What you opened, made, kept, gave to an AI, and got back.", href: "/garden", visual: "orb" }]} />
          </div>
        </div>
      </section>

      {/* Make + bring back */}
      <section id="make" aria-labelledby="make-h" className="scroll-mt-16 border-t border-white/10">
        <h2 id="make-h" className="sr-only">Make something, give it to your AI, bring it back</h2>
        <div className="wrap grid gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div className="glass p-6 sm:p-8"><MakeBox /></div>
          <div id="bring" className="glass scroll-mt-20 p-6 sm:p-8"><BringBack label="Bring it back" hint="When your AI gives you a link, paste its whole reply here. We'll find what it made and open it." /></div>
        </div>
      </section>

      {/* Two AIs */}
      <section aria-labelledby="pass-h" className="border-t border-white/10">
        <div className="wrap grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 id="pass-h" className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-tight">One link, many minds.</h2>
            <p className="mt-4 max-w-[44ch] text-[1.1rem] text-ink-2">Start a game. Give the link to one AI; it moves and hands you a new link. Give that to a different AI. Neither AI can see the other. The link carries everything between them.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/g/ttt" className="btn-glow">Start a game</Link><Link href={EXAMPLE_PASS} className="btn-glass">See an example</Link></div>
          </div>
          <ol className="glass space-y-3 p-6 font-mono text-[0.9rem]" aria-label="How a game travels">
            {[["you", "start the game"], ["AI one", "reads the link, moves, returns a new link"], ["you", "bring it back, pass it on"], ["AI two", "reads it, moves, returns another"], ["you", "see the whole path"]].map(([w, d], i) => (
              <li key={i} className="flex gap-3"><span className="w-16 shrink-0 text-emerald">{w}</span><span className="text-ink-2">{d}</span></li>
            ))}
          </ol>
        </div>
      </section>

      {/* Downstairs: for AI and the curious */}
      <section aria-labelledby="down-h" className="border-t border-white/10 bg-black/20">
        <div className="wrap grid gap-12 py-16 lg:grid-cols-2">
          <div>
            <p className="zone-title">Downstairs</p>
            <h2 id="down-h" className="mt-3 font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">The web is becoming programmable.</h2>
            <p className="mt-4 max-w-[48ch] text-ink-2">Everything above is built on one idea: a URL can be the address of a thing, its state and its next move, readable by people and by AIs alike. This is AI-CI — Artificial Intelligence ↔ Computer Interaction — Abed Kadaan&apos;s research. Underneath are PURL (programmable URLs), the Substrate (computation by address), Continuity (what carries between sessions) and Golden Surface (a browser shared by people and AIs).</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {[["How it works", "/how"], ["Research", "/research"], ["PURL", "/research/purl"], ["Substrate", "/research/substrate"], ["Continuity", "/research/continuity"], ["Golden Surface", "/research/golden-surface"], ["Developers", "/developers"], ["Verify", "/verify"]].map(([k, h]) => <li key={h}><Link href={h} className="chip hover:text-ink">{k}</Link></li>)}
            </ul>
          </div>
          <div id="for-ai" className="scroll-mt-20 rounded-2xl border border-white/10 p-6 text-[0.9rem] text-ink-2">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-ink-3">{OFFER.label}</p>
            <p className="mt-3 font-serif text-xl text-ink">{OFFER.headline}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5">{OFFER.steps.map((s) => <li key={s.n}><b className="font-medium text-ink">{s.name}.</b> {s.text}</li>)}</ol>
            <p className="mt-3 break-all font-mono text-[0.72rem] text-ink-3">{OFFER.template}</p>
            <p className="mt-3">Machine-readable: <a href="/llms.txt">/llms.txt</a> · <a href="/.well-known/ai">/.well-known/ai</a> · <a href="/capabilities.json">/capabilities.json</a> · <a href={`${ORIGIN}/compose`}>/compose</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
