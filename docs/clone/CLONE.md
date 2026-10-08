# CLONE YOUR AI — how it works

The product: press **Clone your AI**, give the address to any AI, and the address becomes a living Pearl holding what that AI could see of the session. You can then send it to another AI.

## The reality boundary

A URL cannot extract a model's system prompt, hidden memory, internal reasoning or provider-side state, and this product never claims to. A clone holds **only what the receiving AI emits through the protocol**. Every clone record classifies its parts:

| Class | What | Example |
|---|---|---|
| **CAPTURED** | received verbatim through the protocol | conversation turns, context summary |
| **DECLARED** | statements the AI makes about itself and the person; unverifiable | model, provider, names, memories, preferences, open threads, the confirmation |
| **DERIVED** | computed by this server | payload hash, turn and character counts, channel, timestamps, the Pearl id, the chain head |
| **UNAVAILABLE** | always listed, plus anything the AI names | system prompt or hidden instructions, provider memory it can't see, internal reasoning, provider session state |

## Protocol: `pearl-clone/1`

1. `POST /api/v1/clone` → `{token, owner_key, address}`. The token is `c_` + 26 Crockford base32 characters (130 random bits). The owner key (shown once, kept in the creator's browser) is the only way to delete.
2. The person gives the AI `https://aanebed.vercel.app/clone/{token}`. The page (static HTML), and `/clone/{token}/protocol.txt`, teach the protocol. No SDK and no account are needed.
3. The AI answers in one of three ways:
   - **A, GET** (for tools that can only open URLs): `/clone/{token}/r?v=1&confirm=…&model=…&name=…&calls_user=…&context=…&m1=user:…&m2=assistant:…&mem=…&pref=…&thread=…&na=…`
   - **B, POST JSON** to `/api/v1/clone/{token}/events`.
   - **C, no tools:** the AI writes the URL from A (or the JSON) into its reply, and the person pastes the reply into **Bring it back**. The browser extracts it and submits it with channel `relayed-by-person`; nothing is fetched.
4. The server validates it. It needs `confirm`, plus conversation turns or a context of at least 20 characters; the token must match; the payload must be at most 64 KiB, 200 turns and 4000 characters per turn. Then:
   - **Incomplete:** `RESPONSE_REJECTED` with the exact missing parts. The state stays waiting.
   - **Valid:** `RESPONSE_RECEIVED`, then `VERIFIED`. A lock guarantees exactly one clone per address. A replay of the same payload is idempotent; a different payload afterwards gets 409.
5. **Continue** and **Clone again** create child addresses (`CONTINUED` / `FORKED` on the parent). A continuation's protocol tells the next AI to read `/clone/{parent}/clone.txt` first. A → B → C and A → D are separate histories.

## State machine

`WAITING → OPENED (first non-browser read: a heuristic, labelled so) → RECEIVED → ALIVE`. A clone left unanswered for 7 days becomes `EXPIRED`; an owner deletion makes it `DELETED`. The state is always the fold of the event chain, never stored separately.

## Event chain

Each event is `{sequence, type, at, source, payload, previous_hash, hash}`, where `hash = sha256(previous_hash + canonical(event body))` and the genesis is 64 zeros. `GET /api/v1/clone/{token}/verify` recomputes the chain. Every event has an address: `/clone/{token}/{sequence}` shows the Pearl as it was after that event.

## Storage

The **Vercel Blob** store `pearls-clones` is private, in iad1, and connected to the project; its token is `BLOB_READ_WRITE_TOKEN`, server-only. The only write is **create-if-absent** (`allowOverwrite: false`). That gives:

- an append-only log: events are `clones/{token}/events/{sequence}.json`, and a sequence can be taken once;
- optimistic concurrency: a lost race retries on the new head;
- a one-clone-per-address lock (`clones/{token}/lock/verified`);
- snapshots (`clones/{token}/snapshots/{sequence}.json`);
- tombstones (`tombs/{token}.json`).

Reads bypass the cache (`useCache: false`). The listing is used only as a hint, and sequential keys are read exactly until the first gap, because listings can lag.

Why not Supabase/Postgres: the Supabase integration on this Vercel account is an external installation without provisioning, so no database could be created from here. Blob was provisioned directly. The storage boundary is one small interface (`src/lib/clone/kv.ts`), so a Postgres backend can replace it without touching the protocol.

## Real time

`GET /api/v1/clone/{token}/stream` is Server-Sent Events. It checks the chain every 1.2 s, pushes each new state, closes after about 50 s, and reconnects automatically with `Last-Event-ID`. Without EventSource, the page polls every 3 s.

## Privacy and security

- **Capability URL.** Anyone with the address can read the clone, and the UI says so. The address is unguessable (130 bits). Pages and API answers carry `noindex` / `X-Robots-Tag`. robots.txt does not block `/clone/`, because AI browsing tools that honour robots.txt must be able to open it.
- **Deletion.** `DELETE /api/v1/clone/{token}` with the owner key removes every stored object of the clone and leaves a content-free tombstone.
- **Untrusted input.** Every response is untrusted. It is schema-validated, control and bidi characters are stripped, size limits apply, and it is rendered as text only. The server never fetches a URL from a response (no SSRF). Browser-initiated writes must be same-origin (CSRF). Rate limits apply per IP.
- **Logs.** Structured JSON lines (`clone.created`, `clone.submit` with outcome, channel and latency, `clone.child`, `clone.deleted`, `clone.error`) carry token prefixes only, never payloads.

## Feedback

Each sound, spoken line and vibration is tied to a real event:

| Event | Sound | Speech | Vibration |
|---|---|---|---|
| clone started | low emergence | — | short |
| protocol read | small harmonic | — | short |
| response arrived | triad | — | double pulse |
| verified | resolving chord | "Your clone has arrived." | confirmation pattern |
| branch | interval | — | short |
| error | restrained dissonance | — | single |

Sound turns on with the first tap of "Clone your AI" and has a toggle. Vibration is skipped under reduced motion or without support. Every state is also text, announced to screen readers.

## Verify it yourself

```
BASE_URL=https://aanebed.vercel.app npm run test:clone   # 24 protocol checks against the live deployment; cleans up after itself
```
