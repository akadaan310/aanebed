import Link from "next/link";
import { Orb } from "./Orb";
import { handLabel, look, type Pearl } from "@/lib/pearls/model";

/** A Pearl in a list: the object, its name, one line, who made it. */
export function Row({ p, code, note }: { p: Pearl; code: string; note?: string }) {
  const last = p.hands.at(-1);
  return (
    <Link href={`/pearl/${code}`} className="group flex items-center gap-4 rounded-3xl px-2 py-4 no-underline transition hover:bg-[rgba(242,234,219,0.04)] sm:gap-6 sm:px-4">
      <span className="shrink-0 transition duration-500 group-hover:-translate-y-0.5"><Orb look={look(p)} size={76} /></span>
      <span className="min-w-0">
        <span className="label">{p.kind}{last ? ` · ${handLabel(last).replace(/^Born from your idea$/, "made by a person").toLowerCase()}` : ""}</span>
        <span className="mt-1 block font-serif text-[1.3rem] leading-snug text-[var(--iv)]">{p.title}</span>
        {p.essence && <span className="mt-1 block text-[0.92rem] leading-relaxed text-[var(--iv2)]">{p.essence}</span>}
        {note && <span className="mt-1 block text-[0.82rem] text-[var(--warm)]">{note}</span>}
      </span>
    </Link>
  );
}
