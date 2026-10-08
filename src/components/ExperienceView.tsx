import Link from "next/link";
import type { Block, Parsed } from "@/lib/experience";
import { resolve, AddressError } from "@/lib/address";
import { NODES } from "@/content/research";
import { TierMark } from "@/components/Status";
import { getStore } from "@/lib/continuity/store";

function Spacetime({ states, n }: { states: number[]; n: number }) {
  const s = Math.max(4, Math.min(12, Math.floor(480 / n)));
  return (
    <svg width={n * s} height={states.length * s} viewBox={`0 0 ${n * s} ${states.length * s}`} className="block h-auto max-w-full" role="img" aria-label={`Space-time diagram: ${states.length} states of ${n} cells, time downward`}>
      {states.flatMap((x, t) => Array.from({ length: n }, (_, i) => ((x >> (n - 1 - i)) & 1 ? <rect key={`${t}-${i}`} x={i * s} y={t * s} width={s - 0.6} height={s - 0.6} className="fill-emerald" /> : null)))}
    </svg>
  );
}

function Computation({ address }: { address: string }) {
  try {
    const r = resolve(address);
    const v = r.value as Record<string, unknown>;
    const n = (v.n_bits as number) ?? Number(address.split("/")[4]);
    const states = Array.isArray(v.states) ? (v.states as number[]) : typeof v.x === "number" ? [v.x as number] : [];
    return (
      <figure className="panel my-8 p-5">
        <p className="label mb-4 !text-emerald">live computation · resolved by this site</p>
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          {states.length > 0 && <Spacetime states={states} n={n} />}
          <div className="min-w-0 font-mono text-[0.78rem] text-ink-2">
            <p className="break-all text-ink"><a href={`/x${r.address}`}>/x{r.address}</a></p>
            <p className="mt-3">{r.derivation.map((d) => d.operation.replace("substrate.", "")).join(" → ")}</p>
            {"transition" in v && <p className="mt-2">{(v.transition as { src: number; dst: number }).src} → {(v.transition as { src: number; dst: number }).dst}</p>}
            {"tail_length" in v && <p className="mt-2">tail {v.tail_length as number} · cycle {v.cycle_length as number}</p>}
            <p className="mt-3 break-all text-ink-3">value_sha256 {r.identity.value_sha256}</p>
          </div>
        </div>
        <figcaption className="mt-4 text-[0.8rem] text-ink-3">The composer wrote the address; this site computed the result. Anyone can recompute it: the same value comes from substrateIO&apos;s reference resolver.</figcaption>
      </figure>
    );
  } catch (e) {
    const msg = e instanceof AddressError ? `${e.status} ${e.code}: ${e.message}` : "could not resolve";
    return <p className="my-6 border-l border-refuse/60 pl-4 font-mono text-[0.8rem] text-refuse">computation refused · /x{address} · {msg}</p>;
  }
}

function ResearchCard({ id }: { id: string }) {
  const n = NODES.find((x) => x.id === id)!;
  return (
    <aside className="my-8 border border-rule-strong p-5">
      <p className="label">from this site&apos;s research record · {n.kind}</p>
      <p className="mt-2 font-serif text-2xl"><Link href={`/research/${n.id}`} className="no-underline hover:text-emerald">{n.name}</Link></p>
      <p className="mt-2 text-ink-2">{n.line}</p>
      <div className="mt-4 grid gap-4 text-[0.85rem] text-ink-2 md:grid-cols-3">
        <div><TierMark tier="demonstrated" /><p className="mt-1">{n.demonstrated[0]}</p></div>
        <div><TierMark tier="proposed" /><p className="mt-1">{n.proposed[0]}</p></div>
        <div><TierMark tier="open" /><p className="mt-1">{n.open[0]}</p></div>
      </div>
    </aside>
  );
}

export function BlockView({ b, i }: { b: Block; i: number }) {
  switch (b.type) {
    case "h": return <h2 className="title mb-5 mt-14 first:mt-0">{b.text}</h2>;
    case "p": return <p className="my-5 text-[1.08rem] leading-relaxed text-ink-2">{b.text}</p>;
    case "note": return <p className="my-6 border-l-2 border-gold/70 bg-gold-deep/20 px-5 py-4 text-ink">{b.text}</p>;
    case "quote": return <blockquote className="my-10 border-l border-rule-strong pl-6"><p className="lede">“{b.text}”</p>{b.cite && <footer className="mt-3 font-mono text-[0.75rem] text-ink-3">— {b.cite}</footer>}</blockquote>;
    case "list": return <ul className="my-6 space-y-2 text-ink-2">{b.items.map((x, k) => <li key={k} className="border-l border-rule pl-4">{x}</li>)}</ul>;
    case "steps": return <ol className="my-6 space-y-3">{b.items.map((x, k) => <li key={k} className="grid grid-cols-[2.5rem_1fr] text-ink-2"><span className="coord pt-1">{String(k + 1).padStart(2, "0")}</span>{x}</li>)}</ol>;
    case "facts": return <dl className="my-6 divide-y divide-rule border-y border-rule">{b.items.map((f, k) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-serif text-ink">{f.k}</dt><dd className="text-ink-2">{f.v}</dd></div>)}</dl>;
    case "table": {
      const [head, ...rows] = b.rows;
      return (
        <div className="my-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full border-collapse text-left text-[0.9rem]">
            <thead><tr>{head.map((c, k) => <th key={k} scope="col" className="label rule-b py-2 pr-4 font-normal">{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, k) => <tr key={k} className="rule-b">{r.map((c, j) => <td key={j} className={`py-3 pr-4 ${j === 0 ? "font-serif text-ink" : "text-ink-2"}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    case "flow":
      return (
        <ol className="my-8 grid gap-px border border-rule bg-rule" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(8rem, 1fr))` }}>
          {b.items.map((x, k) => (
            <li key={k} className="motion-reveal bg-ground p-4" style={{ animationDelay: `${k * 110}ms` }}>
              <p className="coord">{String(k).padStart(2, "0")}</p>
              <p className="mt-1 font-serif text-lg">{x}{k < b.items.length - 1 && <span aria-hidden="true" className="ml-2 font-mono text-emerald">→</span>}</p>
            </li>
          ))}
        </ol>
      );
    case "code": return <pre tabIndex={0} className="machine machine-wrap my-6">{b.text}</pre>;
    case "c": return null;
    case "x": return <Computation address={b.address} />;
    case "research": return <ResearchCard id={b.id} />;
    case "link":
      return (
        <p className="my-5">
          <a href={b.href} rel="nofollow noopener noreferrer ugc" className="arrow-link">{b.label} ↗</a>
          <span className="ml-3 font-mono text-[0.72rem] text-ink-3">leaves this site · {b.host}</span>
        </p>
      );
  }
  void i;
  return null;
}

export function ExperienceView({ parsed, href }: { parsed: Parsed; href: string }) {
  const { doc, id, warnings } = parsed;
  return (
    <article>
      <div className="border-b border-gold/40 bg-[#14120c]">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-1 py-3 font-mono text-[0.72rem] text-ink-2">
          <span className="text-gold">◆ COMPOSED EXPERIENCE</span>
          <span>composed by <span className="text-ink">{doc.by ?? "an unnamed composer"}</span> <span className="text-ink-3">(as stated, unverified)</span></span>
          <span>not written or reviewed by Abed Kadaan</span>
          <span>exists only in its URL · nothing stored</span>
        </div>
      </div>

      <header className="grid-paper border-b border-rule">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          {doc.for && <p className="label mb-6">for {doc.for}</p>}
          <h1 className="display max-w-[16ch] !text-[clamp(2.4rem,6vw,5rem)]">{doc.title}</h1>
          <p className="coord mt-6 break-all">experience {id.slice(0, 23)}… · {doc.blocks.length} blocks · {GRAMMAR_LABEL}</p>
        </div>
      </header>

      <div className="wrap max-w-[48rem] py-14">
        {doc.blocks.map((b, i) => <BlockView key={i} b={b} i={i} />)}
      </div>

      <Between blocks={doc.blocks} />
      <LifeOffer query={href.split("?")[1] ?? ""} ai={nameOf(doc.blocks, "ai")} human={nameOf(doc.blocks, "human")} available={getStore() !== null} />

      <footer className="rule-t">
        <div className="wrap grid gap-10 py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="label mb-3">How this page was made</p>
            <p className="text-ink-2">A person gave an AI the address <Link href="/">abedkadaan.com</Link>. The AI read the site and found its composition grammar. It wrote this page as a URL and gave the URL back. This site renders the URL and computes any live blocks. It stores nothing and adds nothing.</p>
            <p className="mt-4 flex flex-wrap gap-5">
              <Link href={`/compose?${href.split("?")[1] ?? ""}`} className="arrow-link">Edit or remix →</Link>
              <a href={`/e.json?${href.split("?")[1] ?? ""}`} className="arrow-link">This page as JSON →</a>
              <Link href="/" className="arrow-link">The research surface →</Link>
            </p>
          </div>
          <details className="substrate">
            <summary>the document this URL encodes</summary>
            {warnings.length > 0 && <ul className="mt-2 space-y-1 font-mono text-[0.72rem] text-gold">{warnings.map((w, k) => <li key={k}>⚠ {w}</li>)}</ul>}
            <pre tabIndex={0} className="machine mt-2 max-h-80 text-[0.72rem]">{JSON.stringify(doc, null, 1)}</pre>
          </details>
        </div>
      </footer>
    </article>
  );
}

const GRAMMAR_LABEL = "grammar experience/1";

const nameOf = (blocks: Block[], kind: "ai" | "human") => {
  const b = [...blocks].reverse().find((x) => x.type === "c" && x.kind === kind);
  return b && b.type === "c" ? b.text : null;
};

const LABELS: Record<string, string> = { ai: "The AI is called", human: "The person is called", nick: "Nickname", nuance: "Nuance", lex: "Word", mem: "Memory", thread: "Open thread", close: "Closed", said: "Talked about", decision: "Decided" };

/** The continuity entries the composer wrote down: what another session would need to continue. */
function Between({ blocks }: { blocks: Block[] }) {
  const cs = blocks.filter((b): b is Extract<Block, { type: "c" }> => b.type === "c");
  if (!cs.length) return null;
  return (
    <section aria-labelledby="between-h" className="rule-t">
      <div className="wrap max-w-[48rem] py-14">
        <p className="label mb-2">what your AI wrote down about the two of you</p>
        <h2 id="between-h" className="title mb-8">Between you two.</h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {cs.map((c, i) => (
            <div key={i} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
              <dt className="label pt-1">{LABELS[c.kind]}</dt>
              <dd className="text-ink-2">{c.key ? <><span className="font-serif text-[1.05rem] text-ink">{c.key}</span>{c.text && <> — {c.text}</>}</> : c.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[0.85rem] text-ink-3">Nothing here has been stored. It exists only in the link you opened.</p>
      </div>
    </section>
  );
}

/** The gold star: turn this page into a life that any AI session can continue. */
function LifeOffer({ query, ai, human, available }: { query: string; ai: string | null; human: string | null; available: boolean }) {
  return (
    <section id="life" aria-labelledby="life-h" className="border-y border-gold/40 bg-[radial-gradient(ellipse_at_top,#2a2414_0%,#0c0d0c_65%)]">
      <div className="wrap max-w-[52rem] py-16 sm:py-20">
        <p className="label mb-5 !text-gold">◆ a secret, for {human ?? "you"}</p>
        <h2 id="life-h" className="title">{ai ?? "Your AI"} can have an ID and a life here.</h2>
        <div className="mt-6 space-y-4 text-[1.05rem] text-ink-2">
          <p>One click keeps this page and everything your AI wrote about the two of you. You then get a third link: a short continuity link.</p>
          <p>Paste that link into a new chat with <em>any</em> AI: ChatGPT, Gemini, Claude, Perplexity, Copilot. It reads who you two are (the names, the nicknames, the in-jokes, the words you made) and carries on the conversation. Paste it into two places, or ten. Each session writes back, and this site keeps one continuous record for all of them.</p>
        </div>
        {available ? (
          <form method="post" action="/c" className="mt-8 flex flex-wrap items-center gap-4">
            <input type="hidden" name="q" value={query} />
            <button type="submit" className="btn !min-h-12 border-gold px-6 text-[1rem] text-gold hover:bg-gold-deep/40">Give it a life →</button>
            <span className="text-[0.85rem] text-ink-3">This stores the page on abedkadaan.com. Only people and AIs holding the link can read it, and you get a key to erase it.</span>
          </form>
        ) : (
          <p className="mt-8 border-l border-refuse/60 pl-4 text-[0.9rem] text-ink-2">Keeping is not switched on for this deployment yet: no continuity store is configured. The page above still lives in its link.</p>
        )}
      </div>
    </section>
  );
}
