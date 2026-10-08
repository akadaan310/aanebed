# Final report — Pearls v2, the Living Programmable Surface

Date: 2026-10-08 · Branch `ccr-d6dc9f9c-fvwlfi` · Version 2.0.0 · Design: `docs/architecture/PEARLS_V2.md`

v2 makes the existing primitives into phenomena: a Pearl or a computational address shows its state, offers only its legal moves, and changes address when it changes. The research substrate, the vocabulary, the evidence model and every v1 Pearl are preserved. The owner's Claude Pearl keeps its v1.1.0 id, `p_rg86c59j7jmqp0w1`.

## Implemented

- **Living record (`living/1`)** for addresses and Pearls. It covers identity, state, legal affordances (address-producing ones carry the next address), history, parent, related objects, evidence rows (computed / checked / recorded / asserted / external / cannot be established) and an explanation generated from the state.
- **Command palette:** `/` opens it, `?` shows help, single-key shortcuts work (n t x o m b v i e f r = c k p s y l), and keys 1–3 switch layers. The palette is contextual, so illegal commands are absent, and shortcuts ignore text fields.
- **SURFACE · SUBSTRATE · PROOF** layers on every living object.
- **`/live/{address}`:** the browser URL is the computational address. NEXT, PERTURB (touch a cell), TRACE, ORBIT, NORMALIZE and BACK are real links, so they work without JavaScript and the browser's back button works. The address bar animates old → operation → new. PROOF recomputes the value hash in the browser and compares it with the server's.
- **The homepage hero is a living computation Pearl.** Its address lives in the fragment (`/#/map/…`), so the visible URL changes as you act. FORK turns it into a Pearl of your own.
- **Living Pearls on `/e` and `/p`:**
  - an object bar with VERIFY, FORK, REMIX, CARRY, SAVE and EXPLAIN;
  - a **world**, showing related objects as a constellation plus an accessible list;
  - a substrate view (URL anatomy, parsed blocks, state, lineage);
  - a proof view (id recomputed in the browser, plus the evidence rows).
- **FORK, REMIX, COMPARE:**
  - FORK and REMIX produce new Pearls with `from={parent}`; the original is never modified;
  - REMIX shows ORIGINAL · REMIX · DIFF;
  - `/compare` names computation transitions (address A → B) and continuity transitions (thread → close).
- **Grammar:** the optional `from=`, and the `choice:` block (transitions to other addressed objects). Empty experiences are valid but say they are empty. Everything is documented on `/compose` and in the schema.
- **Capabilities:** `pearl.fork`, `pearl.diff`, `living.describe` (pure GETs). The command table is published in `/capabilities.json`, and `living` sections were added to `/.well-known/ai`, `llms.txt` and `/e.json`.
- **`/play`:**
  - the **Seven Verbs**, using MUSA url-machine transitions, labelled an experimental interaction grammar;
  - a **shared surface** in Golden Surface's vocabulary, with visible ownership and authority, refusal of credentials, and convergence through the existing sync model. It is simulated in the browser.
- **AI-generated experience mode:** the "Make me something alive" prompt (Prompt Laboratory #7 and the homepage), plus a showcase experience Pearl.
- **Evidence:** E-016 (TESTED); claims C-23 (TESTED) and C-24 (HYPOTHESIS).

## Tested (local production build)

| Suite | Result |
|---|---|
| Unit | 94 tests: 93 pass, 1 skipped (PostgreSQL store test needs `CB_TEST_PG`), 0 fail |
| Browser (Playwright, desktop + Pixel 7) | 164 pass, 6 skipped (device-specific), 0 fail. Includes axe WCAG 2.1 A/AA on 28 pages × 2 devices, the §44 design journey, keyboard navigation, no-JS links, illegal commands absent, remix with the original unchanged, `/play`, and the machine surface matching the human surface |
| Ingress harness | questions 12/12 (1 skipped: POST /c returns 503 without a store), checks 26/26 |
| Smoke | 38/38 |

Specifically verified: every address-producing affordance resolves, including at the 12-operation limit; `/x` value hashes are unchanged; encoding survives for `&`, `#`, `+`, `%`, spaces and Unicode; a fork or remix leaves the original byte-identical; no command executes visitor-supplied code.

## Deployed

LIVE_PLACEHOLDER

## Proposed (not built)

- Shared persistence of Pearls and history. The adapter exists and is inactive; see FUTURE_PERSISTENCE.
- A general-purpose programming language for URLs. The Seven Verbs are explicitly an experimental grammar.
- New compute engines (Julia and others). The registry stays the only way in.

## Not established

- **C-24:** that a first-time person discovers the address transition within about 90 seconds. No user study was run; the browser test performs the journey, but it is not a person.
- That AIs given the "Make me something alive" prompt compose good living Pearls. No AI provider was tested in this phase.

## Security

- No `eval` and no visitor code.
- Every command maps to a registered pure operation or to the person's own click: the clipboard, or saving to their browser.
- No credentials: the shared-surface simulation refuses anything credential-shaped and has no credential fields.
- No hidden persistence, no outbound fetches from capabilities, no secrets, no force-push.

---

# Previous phase — Pearls product transformation (v1.1.0)

Date: 2026-10-08 · Branch `ccr-d6dc9f9c-fvwlfi` · Product commit `3d51588` · Deployment https://aanebed.vercel.app

This report separates what is **implemented**, **tested**, **deployed**, **proposed** and **blocked**. Nothing below is claimed beyond the evidence named.

## Implemented

- **Product surface.** A light "paper" theme for the product, while the research surface keeps its dark theme (`src/app/(research)/`). A Simple | Explore mode switch over the same data, stored per browser and applied before first paint.
- **Navigation.** Discover / My Pearls / Spaces / Create / Explore. Research, AI Lab, Verify and About stay in the mobile menu and the footer. The former homepage is now `/explore`.
- **Homepage, Acts I–VI:**
  - I: the hero and a live Pearl object.
  - II: a standalone first prompt and Bring a Pearl.
  - III: a transformation demo that runs the product's own resolver, library and portable-link code.
  - IV: the experiences.
  - V: My Pearls and Spaces.
  - VI: the programmable web, the URL anatomy, the topology and the AI offer.
- **Create.** Eight experiences (`/create/*`): Conversation Keeper, Research Space, Creative Studio, Recipe Space, Study Companion, Project Handoff, Workflow Composer and Computation Explorer. Each is a form with live validation and preview. Each can be kept, copied, opened or exported. Each also has a standalone "ask your AI" prompt.
- **Spaces** (`/spaces`):
  - visual cards with counts and suggested spaces;
  - create, rename, and delete (contents move to Archive);
  - move Pearls between spaces;
  - export and verified import;
  - compose a space into a **collection Pearl**: members that do not fit are named, never truncated.
- **Pearl types.** Now nine: `project` and `notes` were added.
- **Capability registry** (`/capabilities`, `/capabilities.json`, plus entries in llms.txt, ai.txt and `/.well-known/ai`):
  - Operations: `pearl.check`, `pearl.decode`, `hash.sha256`, `text.transform` and `compute.eca`.
  - All are pure GETs and rate-limited.
  - Julia is listed as **not available**, with no stand-in.
- **Shared Pearl store adapter** (`src/lib/pearl/server-repository.ts`):
  - content-addressed and never overwrites;
  - re-hashes on write and on read;
  - **inactive**: no configuration, and no route uses it.

## Tested (local production build unless stated)

| Suite | Result |
|---|---|
| Unit (`npm run test:unit`) | 77 tests: 76 pass, 1 skipped (the PostgreSQL store test needs `CB_TEST_PG`), 0 fail |
| Typecheck, `next build` | pass |
| Browser (Playwright, desktop + Pixel 7) | 128 pass, 4 skipped (device-specific), 0 fail. Includes axe WCAG 2.1 A/AA on 21 pages × 2 devices, no-JS, reduced motion, no overflow, and journeys for Bring, Keep, Export/Import, Create, Spaces, modes, the demo and capabilities |
| Ingress harness (`npm run test:ingress`) | questions 12/12 (1 skipped: POST /c returns 503 without a store), checks 26/26 |
| Smoke (`npm run test:smoke`) | 29/29 |

New unit tests cover:
- the capability endpoints, called directly (including the known SHA-256 of "hello");
- tamper rejection in `pearl.decode`;
- collection composition limits;
- the store adapter against an in-memory fake of the REST protocol. It was not tested against a real store.

The owner-supplied Claude Pearl (`tests/fixtures/claude-2026-10-08.url`, evidence E-013) is the regression fixture throughout.

## Deployed and verified live

After `3d51588` was pushed, Vercel deployed it to https://aanebed.vercel.app. Against the live origin:

- `npm run test:smoke` passed **29/29** (`verification/smoke-live-3d51588.json`);
- the ingress harness passed 12/12 questions (1 skipped) and 26/26 checks.

The Playwright suite was run against the local production build, not against the live deployment.

## Proposed (designed, not built)

- Publishing Pearls to a shared store, so that `/p/{id}` short links resolve on any device.
- Accounts, private sharing, and a Postgres model with row-level security (`docs/architecture/FUTURE_PERSISTENCE.md`).
- The continuity brain (ACSP-CB/0.1) on this deployment. The code and SQL exist and are tested in code; the deployment has no store, so it returns 503.
- Further compute engines, such as Julia, behind the `ComputeEngine` interface.

## Blocked, and what would unblock it

| Item | Blocker | Minimum owner action |
|---|---|---|
| Shared short links / cross-device library | No durable store connected; zero environment variables on the project. Supabase is installed on the account but not connected, and was out of scope for this phase | Connect an Upstash/KV store to the project in Vercel → Storage (sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`), then approve the two publish/lookup routes |
| Continuity brain writes | Same: no store | Connect Supabase and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then decide on write authorisation |
| Julia capability | No Julia runtime deployed | Provide a bounded runtime; implement `ComputeEngine` |

## Not done, stated plainly

- **No external AI provider was tested** with the first-Pearl prompt or the Create prompts in this phase. The only real cross-model evidence is the owner-supplied Claude report (E-013). A fresh-session fetch test was proposed and declined.
- "Kept" means kept in this browser's localStorage. It does not sync, and the UI says so.
- Rate limiting is per serverless instance, so it is best-effort.

## Security review

- No secrets or credentials in source.
- No mandatory environment variables.
- No admin token in the browser.
- No signup form or passwords.
- No code evaluation, shell execution or outbound fetch from capabilities.
- Pasted links are parsed, never fetched.
- No `force` push.
