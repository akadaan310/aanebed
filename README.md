# abedkadaan.com — give your AI an ID and a life

The public research surface of Abed Kadaan, and an experiment in **AI-CI**
(Artificial Intelligence ↔ Computer Interaction): one web surface that people
and machine intelligence can both read, enter and operate.

## The main experience: three links

```
01  you give your AI         abedkadaan.com                      plain, nothing else
02  your AI gives you        abedkadaan.com/e?title=…&b=ai:…     your experience, written entirely in the link
03  you give any AI          abedkadaan.com/c/K7Q2M9XTAB         the continuity brain: read and written back by every session
```

1. An AI given the plain URL finds, in the page's **visible text** (and in
   `/llms.txt`, `/ai.txt`, `/.well-known/ai`), a labelled offer. It takes stock
   of the conversation: names, nicknames, coined words, meaningful misspellings,
   running jokes, open threads. Then it composes one URL in the grammar at
   `/compose`.
2. Opening that URL renders the experience (`/e?…`). Nothing is stored. One
   click on **Give it a life** (the person's consent) keeps it.
3. The person gets a short continuity link `/c/{code}` to paste into any number
   of AI sessions, at any provider. Each reads the brain and continues. Each
   writes back with `/c/{code}/w?session=…&b=said:…`, either itself or by handing
   the person the link to click.

What persists is a written record that sessions read and choose to continue. No
model is copied or moved, and session identities are asserted, not proven. The
site says so wherever it matters.

## Built on the research

| | |
|---|---|
| **ACSP** (Continuity) | The brain is ACSP's continuity resource, redesigned as `ACSP-CB/0.1`: append-only events, entries attributed to the session that wrote them, continuity ≠ identity. |
| **PURL** | Every view is an address: `/c/{code}`, `?session=` (what's new since you last wrote), `?at=N` (state at a version), `/json`, `/verify` (replay the hash chain). |
| **substrateIO** | The sequence of writing sessions is recorded as transitions and shown as observed, not interpreted. `/x` reimplements substrateIO's computational addresses and matches its Python resolver hash-for-hash. |

**Deliberate deviation:** writes arrive as GET (`/c/{code}/w?…`), because AI
browsing tools can generally only GET. Writes are idempotent by content hash and
append-only, so a repeated, prefetched or unfurled GET cannot write twice or
erase anything.

## Run

```bash
npm ci
npm run dev                                  # memory store in development
npm test                                     # unit tests (resolver, manifest, grammar, continuity)
npm run build && CONTINUITY_STORE=memory npm start -- -p 3100
BASE_URL=http://localhost:3100 npm run test:ingress     # the AI-ingress simulation (writes verification/ingress-results.json)
NO_SERVER=1 npx playwright test                         # browser matrix (desktop + mobile, axe, keyboard, no-JS…)
```

## Deploy (Vercel + Supabase)

1. Create a Supabase project. Apply `supabase/migrations/0001_continuity_brain.sql`
   (`supabase db push`, or paste it into the SQL editor). It creates two tables
   with row-level security enabled and no policies, an append-only trigger, and
   four `cb_*` functions callable only by the service role.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel (see `.env.example`).
   The site calls the functions through PostgREST with `fetch`; there is no client library.
3. Without those variables, production renders everything else and says that
   keeping is not switched on. It never pretends to remember.

## Layout

```
src/content/        typed records: research nodes, relations, claims, evidence, experiments, the AI offer
src/lib/            address.ts (/x resolver) · experience.ts (URL grammar) · continuity/ (model, store, requests)
                    canonical.ts (canonical JSON + SHA-256, isomorphic) · manifest.ts (llms.txt, ai.txt, manifests)
src/app/            pages; /e, /c/[code] (+ /w, /json, /verify, /forget), /x, machine files
supabase/           the migration
scripts/ingress.ts  a deterministic client given only the root URL
tests/              unit (node:test) and browser (Playwright + axe)
verification/       substrateIO reference vectors, ingress results, the test matrix
```

See `verification/TEST-MATRIX.md` for what has been tested and what has not.
