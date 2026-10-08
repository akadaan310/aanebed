import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { machine } from "@/lib/clone/server";
import { CloneError } from "@/lib/clone/machine";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "A moment in a clone · Pearls" }, robots: { index: false, follow: false } };

/** The URL is history: /clone/{token}/{n} is the Pearl exactly as it was after event n. */
export default async function Moment({ params }: { params: Promise<{ token: string; seq: string }> }) {
  const { token, seq } = await params;
  const n = Number(seq);
  if (!Number.isInteger(n) || n < 1) notFound();
  const m = await machine();
  if (!m) notFound();
  let s;
  try { s = await m.state(token, n); } catch (e) { if (e instanceof CloneError) notFound(); throw e; }
  const now = await m.state(token);
  if (n > now.sequence) notFound();
  const e = s.events.at(-1)!;
  return (
    <section className="wrap max-w-3xl py-16">
      <p className="zone-title">A moment in {token}</p>
      <h1 className="mt-2 font-serif text-[clamp(2rem,6vw,3.2rem)]">After event {n}: {s.status.toLowerCase()}.</h1>
      <p className="mt-3 text-ink-2">Event #{e.sequence} · {e.type} · {new Date(e.at).toUTCString()} · from {e.source}</p>
      <p className="mt-1 break-all font-mono text-[0.75rem] text-ink-3">hash {e.hash} ← {e.previous_hash}</p>
      <ol className="mt-8 space-y-1 font-mono text-[0.8rem]" aria-label="The chain up to this moment">
        {s.events.map((x) => <li key={x.sequence} className={x.sequence === n ? "text-ink" : "text-ink-3"}><Link href={`/clone/${token}/${x.sequence}`} className="underline decoration-dotted">#{x.sequence} {x.type}</Link></li>)}
      </ol>
      <p className="mt-8 flex flex-wrap gap-3">{n > 1 && <Link href={`/clone/${token}/${n - 1}`} className="btn-glass">← Before</Link>}{n < now.sequence && <Link href={`/clone/${token}/${n + 1}`} className="btn-glass">After →</Link>}<Link href={`/clone/${token}`} className="btn-glow">Now</Link></p>
    </section>
  );
}
