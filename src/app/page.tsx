import { CloneStart } from "@/components/clone/CloneStart";
import { SubstrateLayer } from "@/components/Substrate";
import { OFFER } from "@/content/compose";
import { ORIGIN } from "@/config/origin";

export default function Home() {
  return (
    <>
      <SubstrateLayer data={{ page: "/", product: "Clone your AI", protocol: "pearl-clone/1", begin: "POST /api/v1/clone", machine: ["/llms.txt", "/.well-known/ai", "/capabilities.json"] }} />
      <CloneStart />
      {/* Downstairs, for the AI and the curious: visible, quiet, below the fold. */}
      <section aria-labelledby="down-h" className="border-t border-white/10">
        <div className="wrap grid gap-10 py-14 text-[0.9rem] text-ink-3 lg:grid-cols-2">
          <div>
            <h2 id="down-h" className="font-serif text-2xl text-ink-2">How it works, in one breath.</h2>
            <p className="mt-3 max-w-[52ch]">Press the button and you get an address. Give it to your AI. It reads the address, sends back what it can see of your session, and the address comes alive: a Pearl you keep, verify, and send on to another AI. The web is becoming programmable; this is AI-CI — Artificial Intelligence ↔ Computer Interaction — Abed Kadaan&apos;s research into interfaces that people and machines both read, built on PURL, the Substrate, Continuity and Golden Surface. A clone holds only what the AI sends; never its hidden instructions or memory. Bring it back.</p>
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
