import Link from "next/link";
import { Nav } from "@/components/pearls/Nav";
import { SITE } from "@/content/site";
import { ModeSwitch } from "@/components/ModeSwitch";

/** The product's four places. Everything else is downstairs, in the footer. */
export const PRIMARY_NAV = [
  { href: "/", label: "Make" },
  { href: "/explore", label: "Explore" },
  { href: "/play", label: "Play" },
  { href: "/mine", label: "My Pearls" },
] as const;

/** Downstairs: the research and every earlier version, kept as they were. */
export const SECONDARY_NAV = [
  { href: "/research", label: "Research" },
  { href: "/how", label: "How it works" },
  { href: "/atlas", label: "The system underneath" },
  { href: "/world", label: "Earlier: the world (V6)" },
  { href: "/verbs", label: "Earlier: the Seven Verbs" },
  { href: "/developers", label: "Developers" },
  { href: "/about", label: "About" },
] as const;

function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <defs><radialGradient id="pm" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#fffdf8" /><stop offset="0.55" stopColor="#e6d8bf" /><stop offset="1" stopColor="#7c6a50" /></radialGradient></defs>
      <circle cx="12" cy="12" r="10" fill="url(#pm)" />
      <ellipse cx="8.6" cy="7.6" rx="3.2" ry="2" fill="#fff" opacity="0.8" transform="rotate(-28 8.6 7.6)" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="ph no-print">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-[#f2eadb] focus:px-4 focus:py-2 focus:text-[#1e1a15]">Skip to content</a>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 !text-[#f2eadb]" aria-label="Pearls, home">
          <Mark /><span className="font-serif text-[1.3rem] tracking-tight">Pearls</span>
        </Link>
        <Nav items={PRIMARY_NAV} />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="pfoot no-print text-[0.88rem]">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-serif text-[1.25rem] text-[#f2eadb]"><Mark /> Pearls</p>
          <p className="mt-2 max-w-[38ch] leading-relaxed">Make something worth keeping. Ideas become Pearls; Pearls can go places. Made by Abed Kadaan.</p>
        </div>
        <nav aria-label="Downstairs">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.16em]">Downstairs</p>
          <ul className="space-y-1.5">{SECONDARY_NAV.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="For AI">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.16em]">For AI</p>
          <ul className="space-y-1.5 font-mono text-[0.78rem]">
            {["/llms.txt", "/.well-known/ai", "/capabilities.json"].map((p) => <li key={p}><a href={p}>{p}</a></li>)}
          </ul>
          <div className="mt-4"><ModeSwitch /></div>
          <p className="mt-4 font-mono text-[0.72rem]">v{SITE.version} · <a href={SITE.source} className="underline">source</a></p>
        </nav>
      </div>
    </footer>
  );
}
