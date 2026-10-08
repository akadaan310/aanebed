import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceView } from "@/components/ExperienceView";
import { SubstrateLayer } from "@/components/Substrate";
import { parseRequest } from "@/lib/experience-request";
import { EXAMPLE_URL } from "@/lib/experience";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { parsed } = parseRequest(await searchParams);
  const t = parsed.errors.length ? "Composed experience" : `${parsed.doc.title} · composed experience`;
  return {
    title: { absolute: t },
    description: `A page composed as a URL by ${parsed.doc.by ?? "an AI"} on abedkadaan.com. Not written or reviewed by Abed Kadaan.`,
    robots: { index: false, follow: false },
    openGraph: { title: t, description: `Composed by ${parsed.doc.by ?? "an AI"} · rendered by abedkadaan.com from its URL alone` },
  };
}

export default async function ExperiencePage({ searchParams }: Props) {
  const { parsed, query } = parseRequest(await searchParams);
  if (parsed.errors.length) {
    return (
      <section className="wrap py-24">
        <SubstrateLayer data={{ page: "/e", kind: "composed-experience", errors: parsed.errors, grammar: "/compose" }} />
        <p className="label mb-6">composed experience · not rendered</p>
        <h1 className="title max-w-[20ch]">This URL does not encode an experience yet.</h1>
        <ul className="mt-6 space-y-1 font-mono text-[0.85rem] text-refuse">{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        <p className="measure mt-8 text-ink-2">An experience lives entirely in its URL: a title, then blocks such as <code>b=h:Heading</code> and <code>b=p:Text</code>. The grammar is at <Link href="/compose">/compose</Link>. Here is a working example:</p>
        <p className="mt-4"><a href={EXAMPLE_URL} className="arrow-link break-all">Open the example experience →</a></p>
      </section>
    );
  }
  return (
    <>
      <SubstrateLayer data={{ page: "/e", kind: "composed-experience", id: parsed.id, document: parsed.doc, warnings: parsed.warnings, json: `/e.json?${query}` }} />
      <ExperienceView parsed={parsed} href={`/e?${query}`} />
    </>
  );
}
