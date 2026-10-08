# The final experiment: a real AI enters a Pearl, leaves something, and hands it on

Date: 2026-10-08 · Site: https://aanebed.vercel.app · Protocol `pearl-clone/1` · Visit frame `visit/1`

## Question

Can an independent model, given only what a clone address says, participate in the protocol: arrive, leave a Pearl, and let a *different* model pick that Pearl up through the substrate and leave the next one?

The experiment checks participation, not whether the model read a URL. A model "participated" only if its own reply passed `pearl-clone/1` validation and the clone became ALIVE.

## Method (fixed before the run; the protocol was not changed during it)

1. **Clone.** `POST /api/v1/clone` creates an address. `protocol.txt` is read like any client would.
2. **Invitation.** The owner calls `POST /api/v1/clone/{token}/invite`. The deployed server sends one message to the Anthropic Messages API:
   - a constant frame (`visit/1`): who is asking, that the model has no tools, and that it should use way C of the protocol;
   - the person's request;
   - for a continuation, the previous Pearl's `clone.txt`, exactly as served;
   - the clone's own `protocol.txt`, exactly as served.

   The sha256 of that message is recorded before the call, and `/clone/{token}/visit.txt` rebuilds the message and checks it against that hash.
3. **Reply.** The model's whole reply is recorded in `VISITOR_REPLIED`, along with the observed model id, message id, stop reason, token usage and cost. The JSON or return URL is extracted from the reply and submitted through the same path as a relayed reply (channel `anthropic-api`). No field is written on the model's behalf.
4. **One correction.** If the reply is incomplete, the model gets exactly what the Pearl answered (the missing parts) once. A second failure stays a failure.
5. **Handoff.** A continuation address is created from the living Pearl, and the *other* model is invited. It receives Pearl A's `clone.txt` through the substrate, not through a shared conversation.
6. **Reverse.** The same is repeated starting with the other model.

**Models.**

| Model | Role | Max output tokens | Effort |
|---|---|---|---|
| `claude-haiku-5-5` | fast | 4,000 | medium |
| `claude-sonnet-5-5` | deep | 8,000 | medium |

- No tools, and no system prompt beyond the frame.
- No server-side refusal fallback: a fallback would swap the model mid-experiment. A refusal is recorded as a refusal.

**Prompt caching: not used.** Each invitation's prefix contains a unique clone address, so no two requests share a cacheable prefix. The prompts (about 1.5–3k tokens) also sit near the minimum cacheable length. Caching would add code and save nothing.

**Bounds.**
- One invitation per address (a create-if-absent lock).
- At most two calls per visit, each with capped output tokens.
- An append-only spending ledger. Each call reserves its worst case before it is made and is settled to its actual cost afterwards.
- A hard ceiling of US$4.50, which `ANTHROPIC_BUDGET_USD` can lower but never raise.
- A per-client rate limit, and an owner key required to invite.
- No loop: every visit starts from a person's action, or from one line of the experiment script.

**Key handling.** `ANTHROPIC_API_KEY` is a Sensitive, Production-only variable on Vercel. It is read only inside the server function and is not sent to the browser, written into URLs or events, or committed.

**Reproduce.** Run `BASE_URL=https://aanebed.vercel.app npx tsx scripts/anthropic-experiment.ts`. It writes `verification/anthropic-experiment.json`.

## Evidence classes used below

| Class | Meaning |
|---|---|
| OBSERVED | Seen by this server or by the experiment script in production |
| DECLARED | What a model said about itself; not verifiable |
| DERIVED | Computed by the server: hashes, counts, cost |
| TESTED | Established by automated tests, in memory or against a stand-in API |
| UNAVAILABLE | Cannot be observed through this protocol |
| HYPOTHESIS / PROPOSED | Not demonstrated here |

## Results

(Filled in from `verification/anthropic-experiment.json` after the production run.)
