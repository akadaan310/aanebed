import Link from "next/link";
import { NAV, SITE, MACHINE_ENTRYPOINTS } from "@/content/site";

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-ground/95 backdrop-blur-[2px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ground focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="wrap flex h-14 items-center justify-between gap-6">
        <Link href="/" className="group flex items-baseline gap-3 no-underline" aria-label="Abed Kadaan, home">
          <span className="font-serif text-[1.15rem] tracking-tight">Abed Kadaan</span>
          <span className="hidden font-mono text-[0.68rem] text-ink-3 group-hover:text-emerald sm:inline">AI-CI · research surface</span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-[0.88rem] text-ink-2">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="no-underline hover:text-ink">{n.label}</Link></li>
            ))}
            <li><a href="/research.json" className="font-mono text-[0.75rem] text-emerald no-underline hover:underline">research.json</a></li>
          </ul>
        </nav>
        <details className="relative md:hidden">
          <summary className="btn !min-h-10 !py-1.5 text-[0.85rem]" aria-label="Menu">Menu</summary>
          <nav aria-label="Primary (mobile)" className="panel-raised absolute right-0 top-12 w-64 p-2">
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className="block px-3 py-3 no-underline hover:bg-ground">{n.label}</Link></li>
              ))}
              <li><a href="/research.json" className="block px-3 py-3 font-mono text-[0.8rem] text-emerald no-underline">research.json</a></li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="rule-t mt-24 pb-16 pt-12 text-[0.85rem] text-ink-2">
      <div className="wrap grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-serif text-lg text-ink">{SITE.name}</p>
          <p className="measure mt-2">
            This website is one of the research objects it describes. Every page has a second, machine-readable representation embedded in its HTML.
          </p>
          <p className="mt-4 font-mono text-[0.75rem] text-ink-3">
            v{SITE.version} · updated {SITE.updated} ·{" "}
            <a href={SITE.source}>source</a> · <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a>
          </p>
        </div>
        <nav aria-label="Machine interface">
          <p className="label mb-3">Machine interface</p>
          <ul className="space-y-1.5 font-mono text-[0.78rem]">
            {MACHINE_ENTRYPOINTS.map((e) => (
              <li key={e.path}><a href={e.path} className="no-underline hover:text-emerald">{e.path}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className="label mb-3">Read</p>
          <ul className="space-y-1.5">
            <li><Link href="/research" className="no-underline hover:text-ink">Research map</Link></li>
            <li><Link href="/protocol" className="no-underline hover:text-ink">Ingress protocol</Link></li>
            <li><Link href="/experiments" className="no-underline hover:text-ink">Experiments</Link></li>
            <li><Link href="/verify" className="no-underline hover:text-ink">Verify</Link></li>
            <li><Link href="/press" className="no-underline hover:text-ink">Press brief</Link></li>
            <li><Link href="/broadcast" className="no-underline hover:text-ink">Public broadcast</Link></li>
            <li><Link href="/about" className="no-underline hover:text-ink">Abed Kadaan</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
