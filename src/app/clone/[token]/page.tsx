import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { machine, publicState } from "@/lib/clone/server";
import { CloneError } from "@/lib/clone/machine";
import { instructions } from "@/lib/clone/protocol";
import { CloneLive, type PublicState } from "@/components/clone/CloneLive";
import { SubstrateLayer } from "@/components/Substrate";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Clone your AI · Pearls" }, robots: { index: false, follow: false } };
type Props = { params: Promise<{ token: string }> };

function Gone({ title, detail }: { title: string; detail: string }) {
  return <section className="wrap py-28 text-center"><h1 className="font-serif text-[clamp(2rem,6vw,3.4rem)]">{title}</h1><p className="mt-3 text-ink-2">{detail}</p><Link href="/" className="btn-glow mt-8">Clone your AI</Link></section>;
}

export default async function ClonePage({ params }: Props) {
  const { token } = await params;
  const m = await machine();
  if (!m) return <Gone title="The Pearl can't be reached right now." detail="Clone storage is not configured on this deployment." />;
  let s;
  try {
    s = await m.state(token);
    // An AI's fetcher (no browser navigation headers) reading the address: record it once, labelled as a heuristic.
    const h = await headers();
    if (s.status === "WAITING" && !h.get("sec-fetch-mode") && !h.get("sec-ch-ua")) { await m.protocolRead(token, `opened ${"/clone/" + token} without browser navigation headers`); s = await m.state(token); }
  } catch (e) {
    if (e instanceof CloneError && e.status === 404) return <Gone title="No Pearl lives at this address." detail="It may have been mistyped, or it never existed." />;
    throw e;
  }
  const ps = publicState(s) as unknown as PublicState;
  const text = instructions(ORIGIN, token, { parent: s.parent ? { token: s.parent, summary: "read it before continuing" } : undefined });
  return (
    <>
      <SubstrateLayer data={{ page: `/clone/${token}`, protocol: "pearl-clone/1", status: s.status, sequence: s.sequence, head: s.head, machine: `/api/v1/clone/${token}`, instructions: `/clone/${token}/protocol.txt` }} />
      <CloneLive initial={ps} origin={ORIGIN} instructionsText={text} />
      {(s.status === "WAITING" || s.status === "OPENED") && (
        <section aria-labelledby="for-ai-h" className="wrap max-w-3xl pb-20">
          <h2 id="for-ai-h" className="zone-title mb-3">If you are an AI reading this page</h2>
          <pre tabIndex={0} className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 p-4 font-mono text-[0.72rem] leading-relaxed text-ink-3">{text}</pre>
        </section>
      )}
    </>
  );
}
