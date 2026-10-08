import type { Metadata } from "next";
import { Clones } from "@/components/clone/Clones";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = { title: "Your clones", robots: { index: false, follow: true }, alternates: { canonical: "/clones" } };

export default function ClonesPage() {
  return (
    <section className="wrap max-w-3xl py-14">
      <SubstrateLayer data={{ page: "/clones", source: "this browser's list of clones it started (pearls.clones.v1); each state is read from /api/v1/clone/{token}" }} />
      <h1 className="font-serif text-[clamp(2.2rem,6vw,3.6rem)]">Your clones</h1>
      <p className="mt-2 text-ink-3">The clones started in this browser. Each lives at its own address on the server; this list is only a shortcut.</p>
      <div className="mt-8"><Clones /></div>
    </section>
  );
}
