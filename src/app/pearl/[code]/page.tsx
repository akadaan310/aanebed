import type { Metadata } from "next";
import Link from "next/link";
import { decode } from "@/lib/pearls/codec";
import { verify } from "@/lib/pearls/seal";
import { aiAvailable } from "@/lib/pearls/ai";
import { PearlView } from "@/components/pearls/PearlView";
import { SubstrateLayer } from "@/components/Substrate";
import { idOf } from "@/lib/pearls/model";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ born?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await decode((await params).code);
  return { title: { absolute: p ? `${p.title} · Pearls` : "Pearls" }, description: p?.essence || "A Pearl: something someone made and kept.", robots: { index: false, follow: false }, alternates: p ? { types: { "text/plain": `/pearl/${(await params).code}/text` } } : undefined };
}

export default async function PearlPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { born } = await searchParams;
  const p = await decode(code);
  if (!p) return (
    <div className="room flex flex-col items-center justify-center px-4 text-center">
      <h1 className="headline max-w-[18ch]">This link doesn&apos;t hold a whole Pearl.</h1>
      <p className="mt-4 max-w-[44ch] text-[var(--iv2)]">A Pearl lives entirely in its link, so a link that was cut off when it was copied can&apos;t be opened. Ask for the full link, or make something new.</p>
      <Link href="/" className="pbtn mt-8">Make a Pearl</Link>
    </div>
  );
  return <>
    <SubstrateLayer data={{ page: "/pearl/{code}", pearl: idOf(p), format: p.format, kind: p.kind, title: p.title, text: `/pearl/${code}/text`, hands: p.hands.length }} />
    <PearlView pearl={p} code={code} origin={ORIGIN} seal={verify(p)} born={born && ["new", "grown", "edited", "returned"].includes(born) ? born : null} ai={aiAvailable()} />
  </>;
}
