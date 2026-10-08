import { test } from "node:test";
import assert from "node:assert/strict";
import { CloneMachine, CloneError } from "../../src/lib/clone/machine";
import { MemoryKv } from "../../src/lib/clone/kv";
import { Ledger, costOf, ceiling, HARD_CEILING_USD } from "../../src/lib/clone/budget";
import { beginVisit, runVisit, visitPrompt, VISITORS, type Caller, type Call } from "../../src/lib/clone/visitor";
import { verifyChain } from "../../src/lib/clone/chain";
import { sha256 } from "../../src/lib/canonical";

// These tests use a stand-in for the Anthropic API so the bounds can be checked without spending.
// The production experiment (scripts/anthropic-experiment.ts) uses the real API.
const ORIGIN = "https://aanebed.vercel.app";
const jsonReply = (token: string, extra: Record<string, unknown> = {}) => "Here is your poem.\n\n```json\n" + JSON.stringify({ protocol: "pearl-clone/1", token, confirm: "Yes, cloning this session for the person.", source: { model: "claude-haiku-5-5", provider: "Anthropic" }, conversation: [{ role: "user", text: "write a poem" }, { role: "assistant", text: "Salt on the window" }], unavailable: ["system prompt"], ...extra }) + "\n```";
function fake(replies: ((c: Call) => string)[], calls: Call[] = []): Caller {
  let i = 0;
  return async (c) => { calls.push(c); const text = replies[Math.min(i++, replies.length - 1)](c); return { text, model: c.model, id: `msg_${i}`, stop_reason: "end_turn", input_tokens: 3000, output_tokens: 800 }; };
}
const tokenIn = (c: Call) => /\/clone\/(c_[0-9a-z]{26})\/protocol\.txt/.exec(c.messages[0].content)![1];

test("a visit: protocol delivered, the real reply submitted through pearl-clone/1, provenance and cost recorded", async () => {
  const kv = new MemoryKv(), m = new CloneMachine(kv), ledger = new Ledger(kv, 1);
  const { token, ownerKey } = await m.create();
  await assert.rejects(beginVisit(m, { token, ownerKey: "k_wrong", visitor: "haiku", ask: "x", origin: ORIGIN, ledger }), (e: CloneError) => e.status === 403);
  const calls: Call[] = [];
  const { prompt, v } = await beginVisit(m, { token, ownerKey, visitor: "haiku", ask: "write a poem", origin: ORIGIN, ledger });
  assert.equal((await m.state(token)).status, "OPENED");
  assert.equal((await m.state(token)).visitor!.state, "visiting");
  await runVisit(m, { token, prompt, v, ledger, caller: fake([(c) => jsonReply(tokenIn(c))], calls) });
  const s = await m.state(token);
  assert.equal(s.status, "ALIVE");
  assert.deepEqual(s.events.map((e) => e.type), ["CREATED", "INVITED", "VISITOR_REPLIED", "RESPONSE_RECEIVED", "VERIFIED"]);
  assert.equal(s.visitor!.state, "answered");
  assert.equal(s.visitor!.replies[0].model_observed, "claude-haiku-5-5");
  assert.equal(s.clone!.derived.channel, "anthropic-api");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].max_tokens, VISITORS.haiku.max_tokens);
  assert.ok(prompt.includes("write a poem") && prompt.includes(`/clone/${token}/r?v=1`) && prompt.includes("You have no tools here"));
  assert.equal((s.events[1].payload as Record<string, string>).prompt_sha256, sha256(prompt));
  assert.ok(Math.abs((await ledger.status()).spent_usd - costOf("claude-haiku-5-5", 3000, 800)) < 1e-6, "settled to the actual cost");
  assert.deepEqual(verifyChain(s.events), { ok: true, broken: null });
  await assert.rejects(beginVisit(m, { token, ownerKey, visitor: "sonnet", ask: "", origin: ORIGIN, ledger }), (e: CloneError) => e.status === 409);
});

test("an incomplete reply is relayed back once with what is missing; a second failure stays a failure", async () => {
  const kv = new MemoryKv(), m = new CloneMachine(kv), ledger = new Ledger(kv, 1);
  const { token, ownerKey } = await m.create();
  const calls: Call[] = [];
  const { prompt, v } = await beginVisit(m, { token, ownerKey, visitor: "haiku", ask: "", origin: ORIGIN, ledger });
  await runVisit(m, { token, prompt, v, ledger, caller: fake([() => "I would love to, but here is no JSON."], calls) });
  const s = await m.state(token);
  assert.equal(calls.length, 2, "at most two calls per visit");
  assert.match(calls[1].messages[2].content, /INCOMPLETE[\s\S]*Missing: the whole response/);
  assert.equal(s.status, "OPENED");
  assert.equal(s.rejections.length, 2);
  assert.equal(s.visitor!.state, "answered");
  assert.deepEqual(s.visitor!.replies.map((r) => r.final), [false, true]);
});

test("a continuation: the second model reads the first Pearl's clone.txt, and lineage is kept", async () => {
  const kv = new MemoryKv(), m = new CloneMachine(kv), ledger = new Ledger(kv, 1);
  const a = await m.create();
  const va = await beginVisit(m, { token: a.token, ownerKey: a.ownerKey, visitor: "haiku", ask: "write a poem", origin: ORIGIN, ledger });
  await runVisit(m, { token: a.token, ...va, ledger, caller: fake([(c) => jsonReply(tokenIn(c))]) });
  const b = await m.create({ parent: a.token, kind: "continuation" });
  const calls: Call[] = [];
  const vb = await beginVisit(m, { token: b.token, ownerKey: b.ownerKey, visitor: "sonnet", ask: "", origin: ORIGIN, ledger });
  assert.ok(vb.prompt.includes(`CLONE ${a.token}`) && vb.prompt.includes("Salt on the window") && vb.prompt.includes("Pick this up"), "B receives A through the substrate");
  await runVisit(m, { token: b.token, ...vb, ledger, caller: fake([(c) => jsonReply(tokenIn(c), { source: { model: "claude-sonnet-5-5" } })], calls) });
  const A = await m.state(a.token), B = await m.state(b.token);
  assert.equal(calls[0].model, "claude-sonnet-5-5");
  assert.equal(B.status, "ALIVE"); assert.equal(B.parent, a.token); assert.equal(B.visitor!.read_parent, a.token);
  assert.equal(A.visitor!.model, "claude-haiku-5-5"); assert.equal(B.visitor!.model, "claude-sonnet-5-5");
  assert.notEqual(A.clone!.pearl_id, B.clone!.pearl_id);
  assert.equal(vb.prompt, visitPrompt({ origin: ORIGIN, token: b.token, ask: "Pick this up and take it one step further.", parent: { token: a.token, text: (await import("../../src/lib/clone/machine")).cloneText(A) } }), "visit.txt can rebuild it exactly");
});

test("the budget ceiling holds: refused before calling, and simultaneous reservations never cross it", async () => {
  const kv = new MemoryKv(), ledger = new Ledger(kv, 0.05);
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => ledger.reserve(0.01, "claude-haiku-5-5", "c_test")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
  assert.ok((await ledger.status()).spent_usd <= 0.05);
  const m = new CloneMachine(kv);
  const { token, ownerKey } = await m.create();
  await assert.rejects(beginVisit(m, { token, ownerKey, visitor: "sonnet", ask: "", origin: ORIGIN, ledger }), (e: CloneError) => e.status === 402);
  // reservation fails mid-visit (spent by others meanwhile): no call is made, and the clone says why
  const kv2 = new MemoryKv(), m2 = new CloneMachine(kv2), tight = new Ledger(kv2, 0.2);
  const c = await m2.create();
  const vis = await beginVisit(m2, { token: c.token, ownerKey: c.ownerKey, visitor: "sonnet", ask: "", origin: ORIGIN, ledger: tight });
  await tight.reserve(0.15, "other", "c_other");
  const calls: Call[] = [];
  await runVisit(m2, { token: c.token, ...vis, ledger: tight, caller: fake([() => "never"], calls) });
  assert.equal(calls.length, 0);
  assert.equal((await m2.state(c.token)).visitor!.state, "failed");
  assert.equal(ceiling({ ANTHROPIC_BUDGET_USD: "999" }), HARD_CEILING_USD, "the ceiling cannot be raised from the environment");
});

test("an unreachable API and a lost visit are reported, never shown as success", async () => {
  const kv = new MemoryKv(); let now = Date.parse("2026-10-08T12:00:00Z");
  const m = new CloneMachine(kv, () => new Date(now)), ledger = new Ledger(kv, 1);
  const a = await m.create();
  const va = await beginVisit(m, { token: a.token, ownerKey: a.ownerKey, visitor: "haiku", ask: "", origin: ORIGIN, ledger });
  await runVisit(m, { token: a.token, ...va, ledger, caller: async () => { throw Object.assign(new Error("overloaded"), { status: 529 }); } });
  assert.equal((await m.state(a.token)).visitor!.failed, "The AI could not be reached (HTTP 529).");
  const b = await m.create();
  await beginVisit(m, { token: b.token, ownerKey: b.ownerKey, visitor: "haiku", ask: "", origin: ORIGIN, ledger });
  now += 5 * 60_000;
  assert.equal((await m.state(b.token)).visitor!.state, "lost");
});
