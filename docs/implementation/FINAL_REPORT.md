# Final report — Pearls product transformation

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
| Browser (Playwright, desktop + Pixel 7) | 128 pass, 4 skipped (device-specific), 0 fail. Includes axe WCAG 2.1 A/AA on 20 pages × 2 devices, no-JS, reduced motion, no overflow, and journeys for Bring, Keep, Export/Import, Create, Spaces, modes, the demo and capabilities |
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
