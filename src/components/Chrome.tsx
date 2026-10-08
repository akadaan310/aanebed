import Link from "next/link";
import { SITE, MACHINE_ENTRYPOINTS } from "@/content/site";
import { ModeSwitch } from "@/components/ModeSwitch";
import { PearlGlyphClient } from "@/components/pearl/PearlGlyphClient";
import { HOST } from "@/config/origin";

export const PRIMARY_NAV = [
  { href: "/", label: "Discover" },
  { href: "/workspace", label: "My Pearls" },
  { href: "/spaces", label: "Spaces" },
  { href: "/create", label: "Create" },
  { href: "/explore", label: "Explore" },
] as const;

/** The research surface stays one tap away. */
export const SECONDARY_NAV = [
  { href: "/live", label: "Live" },
  { href: "/play", label: "Play" },
  { href: "/research", label: "Research" },
  { href: "/ai", label: "AI Lab" },
  { href: "/verify", label: "Verify" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-ground/90 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ground">
        Skip to content
      </a>
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="Pearls, home">
          <PearlGlyphClient size={24} />
          <span className="font-serif text-[1.35rem] tracking-tight">Pearls</span>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-[0.95rem]">
            {PRIMARY_NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="rounded-full px-3.5 py-2 text-ink-2 no-underline hover:bg-raised hover:text-ink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block"><ModeSwitch /></span>
          <Link href="/#first" className="btn-solid hidden !min-h-10 !py-2 text-[0.9rem] md:inline-flex">Try your first Pearl</Link>
          <details className="relative lg:hidden">
            <summary className="btn-soft !min-h-10 !py-2" aria-label="Menu">Menu</summary>
            <nav aria-label="Primary (mobile)" className="card absolute right-0 top-12 w-72 p-2 shadow-xl">
              <ul className="flex flex-col">
                {PRIMARY_NAV.map((n) => (
                  <li key={n.href}><Link href={n.href} className="block rounded-lg px-3 py-3 text-[1.02rem] no-underline hover:bg-raised">{n.label}</Link></li>
                ))}
              </ul>
              <ul className="mt-1 grid grid-cols-2 border-t border-rule pt-1 text-[0.9rem] text-ink-2">
                {SECONDARY_NAV.map((n) => (
                  <li key={n.href}><Link href={n.href} className="block rounded-lg px-3 py-2.5 no-underline hover:bg-raised hover:text-ink">{n.label}</Link></li>
                ))}
              </ul>
              <div className="border-t border-rule px-3 py-3 sm:hidden"><ModeSwitch /></div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule pb-16 pt-12 text-[0.9rem] text-ink-2">
      <div className="wrap grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-serif text-xl text-ink"><PearlGlyphClient size={20} /> Pearls</p>
          <p className="measure mt-2">Programmable URLs for AI. Your AI makes a Pearl; you bring it here, keep it, and carry it on. Made by Abed Kadaan.</p>
          <p className="mt-4 font-mono text-[0.75rem] text-ink-3">{HOST} · v{SITE.version} · <a href={SITE.source}>source</a></p>
        </div>
        <nav aria-label="Product">
          <p className="mb-3 font-semibold text-ink">Product</p>
          <ul className="space-y-1.5">
            {PRIMARY_NAV.map((n) => <li key={n.href}><Link href={n.href} className="no-underline hover:text-ink">{n.label}</Link></li>)}
            <li><Link href="/live" className="no-underline hover:text-ink">Live addresses</Link></li>
            <li><Link href="/play" className="no-underline hover:text-ink">Play</Link></li>
            <li><Link href="/compare" className="no-underline hover:text-ink">Compare</Link></li>
            <li><Link href="/prompts" className="no-underline hover:text-ink">Prompts</Link></li>
            <li><Link href="/continue" className="no-underline hover:text-ink">Continuity Pearls</Link></li>
          </ul>
        </nav>
        <nav aria-label="Research">
          <p className="mb-3 font-semibold text-ink">Research</p>
          <ul className="space-y-1.5">
            <li><Link href="/research" className="no-underline hover:text-ink">Research map</Link></li>
            <li><Link href="/ai" className="no-underline hover:text-ink">AI Lab</Link></li>
            <li><Link href="/verify" className="no-underline hover:text-ink">Verify</Link></li>
            <li><Link href="/compose" className="no-underline hover:text-ink">Pearl grammar</Link></li>
            <li><Link href="/press" className="no-underline hover:text-ink">Press brief</Link></li>
            <li><Link href="/about" className="no-underline hover:text-ink">About Abed</Link></li>
          </ul>
        </nav>
        <nav aria-label="Machine interface">
          <p className="mb-3 font-semibold text-ink">For AI</p>
          <ul className="space-y-1.5 font-mono text-[0.78rem]">
            {MACHINE_ENTRYPOINTS.filter((e) => ["/llms.txt", "/ai.txt", "/.well-known/ai", "/research.json", "/capabilities.json", "/e.json"].includes(e.path)).map((e) => (
              <li key={e.path}><a href={e.path} className="no-underline hover:text-ink">{e.path}</a></li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
