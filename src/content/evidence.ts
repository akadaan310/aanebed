import type { EvidenceRecord } from "./types";

const CONTAINER =
  "Clean Linux container, Node.js 22.22.0, Python 3.13.16; repositories freshly cloned from GitHub";
const OBSERVER = "The machine-side participant (Claude, an AI coding agent), building this site";

/**
 * Evidence is recorded, not summarised. Every record says what was run, where,
 * at which commit, and what it does NOT show.
 */
export const EVIDENCE: EvidenceRecord[] = [
  {
    id: "E-001",
    title: "PURL test suite re-run",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "purl",
    commit: "3df4452a3624b3f5492bf23c2dacc49d8d2b33c7",
    command: "npm test",
    environment: CONTAINER,
    result: "58 tests, 58 pass, 0 fail (protocol, authority, HTTP, research, demo, reproducibility).",
    caveat: "Tests check the reference implementation against its own specification. They do not show that independent agents use the protocol.",
  },
  {
    id: "E-002",
    title: "PURL experiment exp-0001 reproduced from raw data",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "purl",
    commit: "3df4452a3624b3f5492bf23c2dacc49d8d2b33c7",
    command: "npm run reproduce -- exp-0001",
    environment: CONTAINER,
    result:
      "Re-run record hash sha256:0f8ba424…6d7389 equals the committed hash. Raw data, transformation outputs and hypothesis outcomes match. The committed report records 8 of 11 pre-registered hypotheses supported and 3 not supported.",
    caveat: "Reproduction shows the computation is deterministic and the record is honest. It does not re-judge the hypotheses or their interpretation.",
  },
  {
    id: "E-003",
    title: "ACSP protocol harness and unit tests re-run",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "acsp",
    commit: "9fcf2e1da3ce01a4e66eb5be5e2249b1f211878b",
    command: "npm ci && npm run harness && npx vitest run",
    environment: CONTAINER + "; in-process transport, embedded PGlite database",
    result:
      "16 of 16 harness scenarios passed, 402 checks, 0 skipped (core-demonstration 89 checks, authority-matrix 25, handoff 22, proposals 19, failures 47, get-safety 34, and more). Vitest: 2 files, 24 tests passed.",
    caveat: "The harness uses simulated deterministic actors, not language models. It tests the protocol, not how models behave inside it.",
  },
  {
    id: "E-004",
    title: "ACSP live deployment answered",
    status: "OBSERVED",
    observer: OBSERVER + ", through a read-only web fetch",
    date: "2026-10-08",
    repository: "acsp",
    command: "GET https://acsp-one.vercel.app/.well-known/acsp · /protocol · /r/8N2RXG1MW79S.json",
    result:
      "All three returned HTTP 200. Discovery document reports ACSP/0.1. The field-trial resource \"ACSP cross-model transport experiment\" is active at version 12 with 3 TOKs (a finding, a hypothesis that a session from another provider can use it with no prior context, and a task) and 7 pending proposals from other sessions, all with identity_assurance \"asserted\", none resolved.",
    caveat: "One observation at one time. The 7 unresolved proposals mean the cross-provider hypothesis has not been evaluated by the resource owner; no conclusion is drawn here.",
  },
  {
    id: "E-005",
    title: "substrateIO tests, validator and experiments re-run",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "substrateio",
    commit: "7ace119a544fc736f0d4ec1d72cded9dad0a83e3",
    command: "python3 -m unittest discover -s tests -t . && python3 -m tools.validate && python3 -m experiments.run_all --dry",
    environment: CONTAINER,
    result:
      "58 tests OK. Validator: 0 violations. EXP-A to EXP-G: every check passed (6/6, 8/8, 5/5, 5/5, 4/4, 7/7, 8/8) with run ids EXP-A-62e825df89fa … EXP-G-51648a077ba0.",
    caveat: "All perturbation results in substrateIO are SIMULATED (injected bit flips in a model). Nothing physical has been observed.",
  },
  {
    id: "E-006",
    title: "Computational addresses: two independent implementations agree",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "substrateio",
    commit: "7ace119a544fc736f0d4ec1d72cded9dad0a83e3",
    command: "npm run test:unit (tests/unit/address.test.ts against verification/substrateio-vectors.json)",
    environment: CONTAINER,
    result:
      "This site's TypeScript resolver at /x reproduces the value and value_sha256 of substrateIO's Python resolver for 12 reference addresses (10 resolutions and 2 refusals), including /map/eca/90/8/state/5/next → x = 136.",
    caveat: "Covers the ECA subset this site implements (map, state, next, flip, trace, orbit). substrateIO's other operations are not reimplemented here.",
  },
  {
    id: "E-007",
    title: "Golden Surface relay and sync tests, partly reproduced",
    status: "REPRODUCED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "golden-surface",
    commit: "b11371878e8bda63b45848d42d41351fdaa273a8",
    command: "python3 store/test_store.py; relay/relay.py + python3 tests/test_relay.py (FakePhone)",
    environment: CONTAINER + "; aiohttp in a virtualenv; fresh seat tokens from relay/setup-env.sh",
    result:
      "Store test passed. Relay test passed (PHASE 2 OK): a deliberately dropped op was detected as class op-lost, replay converged, and an op queued while the phone was offline was redelivered on reconnect and converged.",
    caveat:
      "Not reproduced here: tests/test_sync_loud.py (needs the sync-convergence watcher running as a systemd unit) and tests/test_watchers.py (needs Playwright for the twin browser). The Android app and a real sign-in on a phone were not tested here; the repository's own acceptance table lists the real phone sign-in as open.",
  },
  {
    id: "E-008",
    title: "Golden Surface acceptance record (author's)",
    status: "TESTED",
    observer: "The repository's own acceptance table (docs/ACCEPTANCE.md)",
    date: "2026-09-29",
    repository: "golden-surface",
    commit: "b11371878e8bda63b45848d42d41351fdaa273a8",
    result:
      "Items 1 to 4 are recorded as machine-verified. Items 5 to 8 (Expo Go flow, persistence across kill, loud desync, APK) are recorded as emulator-verified. One item stays open: a real Google sign-in by Abed's own fingers on his phone.",
    caveat: "The author's record, not re-run by this site.",
  },
  {
    id: "E-009",
    title: "Baseline: abedkadaan.com before this site",
    status: "OBSERVED",
    observer: OBSERVER + ", through a read-only web fetch",
    date: "2026-10-08",
    command: "GET https://abedkadaan.com/ · /robots.txt · /sitemap.xml · /llms.txt",
    result:
      "The domain served a one-page sales site for a fixed-price website package. robots.txt allowed all; the sitemap was an empty urlset; /llms.txt returned 404. A machine given only the URL could find no research, no repositories and no machine-readable description.",
    caveat: "This is the baseline for the AI-ingress experiment. It is not a criticism of that page.",
  },
  {
    id: "E-010",
    title: "AI-ingress simulation against this site",
    status: "TESTED",
    observer: "scripts/ingress.ts: a deterministic client that receives only the root URL",
    date: "2026-10-08",
    repository: "site",
    command: "npm run build && npm start & npm run test:ingress",
    result: "Recorded at /verify/ingress.json: 9 questions, the answers a URL-only client could derive, and the links it followed.",
    caveat:
      "The harness is a scripted client, not a language model. It shows what is discoverable from the URL, not what any particular AI product will do with it.",
  },
  {
    id: "E-011",
    title: "Continuity brain: the SQL migration on PostgreSQL 16",
    status: "TESTED",
    observer: OBSERVER,
    date: "2026-10-08",
    repository: "site",
    command: "CB_TEST_PG='-h /tmp -p 54329 -U postgres -d cbtest' npm run test:unit (tests/unit/continuity.test.ts)",
    environment: CONTAINER + "; PostgreSQL 16.15 with pgcrypto; supabase/migrations/0001_continuity_brain.sql applied twice (idempotent)",
    result:
      "The same scenario passed against the in-memory store and the real SQL functions. A genesis and three sessions wrote in turn; a repeated write was recorded once; state folded correctly, including names kept, a nickname refined and a thread closed by another session; state at v1 was replayable; hashes computed in SQL verified in JavaScript; a tampered entry was detected; forget required the owner key. Direct UPDATE and DELETE on events were refused by the trigger, and the anon role was denied.",
    caveat: "Run against plain PostgreSQL with Supabase's roles created by hand, not against a hosted Supabase project. The PostgREST transport is exercised by its unit, not end to end.",
  },
  {
    id: "E-012",
    title: "The three links, end to end against a production build",
    status: "TESTED",
    observer: "scripts/ingress.ts (deterministic client) against next start with the memory store",
    date: "2026-10-08",
    repository: "site",
    command: "CONTINUITY_STORE=memory npm start & npm run test:ingress",
    result: "Recorded at /verify/ingress.json, questions 10 to 12: whether the offer is readable in the root page's static text, whether a URL built from the documented template renders, and whether a kept brain is read and written by several sessions.",
    caveat:
      "The client follows the documented template; it is not a language model deciding to do so. Whether ChatGPT, Gemini, Claude, Perplexity and others will do it unprompted, and whether their browsing tools may open a write link, is untested (C-18).",
  },
];

export function evidence(id: string): EvidenceRecord {
  const e = EVIDENCE.find((x) => x.id === id);
  if (!e) throw new Error(`unknown evidence ${id}`);
  return e;
}
