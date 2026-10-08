import { CloneStart } from "@/components/clone/CloneStart";
import { SubstrateLayer } from "@/components/Substrate";
import { OFFER } from "@/content/compose";
import { ORIGIN } from "@/config/origin";
import { EXAMPLE_LINEAGE } from "@/config/example";

export default function Home() {
  return (
    <>
      <SubstrateLayer data={{ page: "/", product: "Clone your AI", protocol: "pearl-clone/1", begin: "POST /api/v1/clone", machine: ["/llms.txt", "/.well-known/ai", "/capabilities.json"] }} />
      <CloneStart />
      {/* Downstairs, for the AI and the curious: visible, quiet, below the fold. */}
      <section aria-labelledby="down-h" className="border-t border-white/10">
        <div className="wrap grid gap-10 py-14 text-[0.9rem] text-ink-3 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 id="down-h" className="font-serif text-2xl text-ink-2">How it works, in one breath.</h2>
              <p className="mt-3 max-w-[52ch]">Press the button and you get an address. Give it to your AI — or let a real Claude in. It reads the address, does what you asked, and leaves it there: a Pearl you keep. Hand the Pearl to another intelligence and it picks up where the first one stopped, then leaves the next. The conversation isn&apos;t the container; the address is. A Pearl holds only what an AI chose to send — never its hidden instructions, memory or reasoning, and it says so.</p>
              {EXAMPLE_LINEAGE && <p className="mt-3">See one that already happened: <a href={`/clone/${EXAMPLE_LINEAGE.first}`} className="underline">{EXAMPLE_LINEAGE.models[0]}</a> → <a href={`/clone/${EXAMPLE_LINEAGE.second}`} className="underline">{EXAMPLE_LINEAGE.models[1]}</a>.</p>}
            </div>
            <div>
              <h2 className="font-serif text-xl text-ink-2">The same thing, for organisations.</h2>
              <p className="mt-2 max-w-[52ch]">What lets one person continue an AI session lets a team, an agency, a website or a service give AI work a persistent address: a customer request one AI starts and another finishes, research that outlives the session it began in, AI-to-AI handoffs a person can open and check.</p>
            </div>
            <div>
              <h2 className="font-serif text-xl text-ink-2">Downstairs.</h2>
              <p className="mt-2 max-w-[52ch]">The web is becoming programmable. This is AI-CI — Artificial Intelligence ↔ Computer Interaction — Abed Kadaan&apos;s research into interfaces people and machines both read, built on PURL, the Substrate, Continuity and Golden Surface. <a href="/world" className="underline">The world</a> · <a href="/research" className="underline">Research</a> · <a href="/how" className="underline">How it works</a></p>
              <p className="mt-3 max-w-[52ch]"><b className="font-medium text-ink-2">An open question.</b> How much can a very small model — a million parameters, a hundred million, a billion — do when continuity no longer has to live inside the model, and lives in an address instead? Not answered here. Bring it back.</p>
            </div>
          </div>
          <div id="for-ai" className="rounded-2xl border border-white/10 p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.14em]">{OFFER.label}</p>
            <p className="mt-2 font-serif text-lg text-ink-2">{OFFER.headline}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">{OFFER.steps.map((s) => <li key={s.n}><b className="font-medium text-ink-2">{s.name}.</b> {s.text}</li>)}</ol>
            <p className="mt-3 break-all font-mono text-[0.7rem]">{OFFER.template}</p>
            <p className="mt-3">To clone a session: <span className="font-mono">POST {ORIGIN}/api/v1/clone</span>, then follow <span className="font-mono">/clone/&#123;token&#125;/protocol.txt</span>. Machine-readable: <a href="/llms.txt">/llms.txt</a> · <a href="/.well-known/ai">/.well-known/ai</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
