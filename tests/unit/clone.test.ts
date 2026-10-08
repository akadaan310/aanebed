import { test } from "node:test";
import assert from "node:assert/strict";
import { CloneMachine, CloneError, TOKEN, cloneText } from "../../src/lib/clone/machine";
import { MemoryKv, BlobKv, type BlobApi } from "../../src/lib/clone/kv";
import { validate, fromQuery, instructions, ALWAYS_UNAVAILABLE } from "../../src/lib/clone/protocol";
import { verifyChain } from "../../src/lib/clone/chain";

const good = (token: string, extra: Record<string, unknown> = {}) => ({
  protocol: "pearl-clone/1", token, confirm: "Yes — cloning this session for Sam, with their consent.",
  source: { model: "Claude Opus", provider: "Anthropic" }, identity: { name: "Sunny", calls_user: "Sam" },
  conversation: [{ role: "user", text: "Let's plan the trip." }, { role: "assistant", text: "Lisbon first, then Porto." }],
  context: "Planning a two-week trip; Sam gets seasick.", memory: ["no boat days"], preferences: ["short answers"], threads: ["book the train"], unavailable: ["my system prompt"], ...extra,
});

/** A fake of @vercel/blob with its real semantics: put fails if the pathname exists; list can lag behind writes. */
function fakeBlob(lag = false): BlobApi {
  const m = new Map<string, string>(); const visible = new Set<string>();
  return {
    async put(p, body) { if (m.has(p)) throw Object.assign(new Error("Vercel Blob: This blob already exists, use `allowOverwrite: true` if you want to overwrite it."), { name: "BlobError" }); m.set(p, body); if (!lag) visible.add(p); else setTimeout(() => visible.add(p), 5); return {}; },
    async get(p) { const v = m.get(p); return v === undefined ? null : { stream: new Response(v).body! }; },
    async list({ prefix }) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix) && visible.has(k)).sort().map((k) => ({ pathname: k, url: "blob://" + k })), hasMore: false }; },
    async del(urls) { for (const u of urls) { const k = u.replace("blob://", ""); m.delete(k); visible.delete(k); } },
  };
}

for (const [name, mk] of [["memory", () => new MemoryKv()], ["vercel-blob (fake with real semantics, lagging list)", () => new BlobKv(fakeBlob(true))]] as const) {
  test(`[${name}] create → receive → validate → persist → verify; replay is idempotent; history is a valid hash chain`, async () => {
    const m = new CloneMachine(mk());
    const { token, ownerKey, state } = await m.create();
    assert.match(token, TOKEN); assert.match(ownerKey, /^k_/);
    assert.equal(state.status, "WAITING");
    await m.protocolRead(token, "test");
    assert.equal((await m.state(token)).status, "OPENED");
    const r = await m.submit(token, good(token), "direct-post");
    assert.equal(r.outcome, "verified"); assert.equal(r.status, 201);
    const s = r.state;
    assert.equal(s.status, "ALIVE");
    assert.deepEqual(s.events.map((e) => e.type), ["CREATED", "PROTOCOL_READ", "RESPONSE_RECEIVED", "VERIFIED"]);
    assert.equal(s.clone!.declared.source.model, "Claude Opus");
    assert.equal(s.clone!.captured.conversation.length, 2);
    for (const u of ALWAYS_UNAVAILABLE) assert.ok(s.clone!.unavailable.includes(u), "the reality boundary is always in the record");
    assert.match(s.clone!.pearl_id, /^p_[0-9a-z]{16}$/);
    assert.deepEqual(verifyChain(s.events), { ok: true, broken: null });
    const again = await m.submit(token, good(token), "relayed-by-person");
    assert.equal(again.outcome, "duplicate"); assert.equal(again.state.events.length, 4, "a replay adds nothing");
    await assert.rejects(m.submit(token, good(token, { context: "something else entirely, a different clone" }), "direct-post"), (e: CloneError) => e.status === 409);
  });

  test(`[${name}] concurrent responses: exactly one is cloned, the chain stays intact`, async () => {
    const m = new CloneMachine(mk());
    const { token } = await m.create();
    const results = await Promise.allSettled([1, 2, 3, 4, 5].map((i) => m.submit(token, good(token, { context: `parallel response number ${i}, long enough` }), "direct-post")));
    const ok = results.filter((r) => r.status === "fulfilled" && r.value.outcome === "verified");
    assert.equal(ok.length, 1);
    const s = await m.state(token);
    assert.equal(s.events.filter((e) => e.type === "VERIFIED").length, 1);
    assert.deepEqual(verifyChain(s.events), { ok: true, broken: null });
  });
}

test("incomplete, malformed and oversized responses are refused with exactly what is missing", async () => {
  const m = new CloneMachine(new MemoryKv());
  const { token } = await m.create();
  const r = await m.submit(token, { protocol: "pearl-clone/1", token }, "direct-get");
  assert.equal(r.status, 422);
  assert.deepEqual(r.missing, ["confirm (a short statement that you are cloning this session for the person)", "session material: conversation turns, or a context summary of at least 20 characters"]);
  assert.equal(r.state.status, "WAITING", "an incomplete response never marks the clone received");
  assert.equal((await m.submit(token, "not an object", "direct-post")).status, 422);
  const wrong = await m.submit(token, good("c_" + "0".repeat(26)), "direct-post");
  assert.match(wrong.problems!.join(" "), /different clone token/);
  await assert.rejects(m.submit(token, good(token, { context: "x".repeat(70_000) }), "direct-post"), (e: CloneError) => e.status === 413);
  assert.equal((await m.state(token)).rejections.length, 3);
});

test("expired, deleted, unknown and unauthorized access are all refused", async () => {
  let now = new Date("2026-10-08T00:00:00Z");
  const m = new CloneMachine(new MemoryKv(), () => now);
  const { token, ownerKey } = await m.create();
  now = new Date("2026-10-16T00:00:00Z");
  assert.equal((await m.state(token)).status, "EXPIRED");
  await assert.rejects(m.submit(token, good(token), "direct-post"), (e: CloneError) => e.status === 410 && e.code === "expired");
  await assert.rejects(m.state("c_" + "1".repeat(26)), (e: CloneError) => e.status === 404);
  await assert.rejects(m.state("../../etc/passwd"), (e: CloneError) => e.status === 404);
  await assert.rejects(m.remove(token, "k_wrong"), (e: CloneError) => e.status === 403);
  assert.ok((await m.remove(token, ownerKey)) >= 2);
  assert.equal((await m.state(token)).status, "DELETED");
  assert.equal((await m.state(token)).events.length, 0, "deleted means the material is gone, not hidden");
  await assert.rejects(m.submit(token, good(token), "direct-post"), (e: CloneError) => e.status === 410);
});

test("continue, fork, clone a clone: A → B → C and A → D as separate histories with parent links", async () => {
  const m = new CloneMachine(new MemoryKv());
  const a = await m.create();
  await assert.rejects(m.create({ parent: a.token }), (e: CloneError) => e.code === "parent_not_alive", "no continuation from a clone that never arrived");
  await m.submit(a.token, good(a.token), "direct-post");
  const b = await m.create({ parent: a.token, kind: "continuation" });
  const d = await m.create({ parent: a.token, kind: "fork" });
  await m.submit(b.token, good(b.token, { context: "continued in a second AI, which read clone A first" }), "relayed-by-person");
  const c = await m.create({ parent: b.token });
  const A = await m.state(a.token), B = await m.state(b.token), C = await m.state(c.token), D = await m.state(d.token);
  assert.deepEqual(A.children.map((x) => [x.token, x.kind]), [[b.token, "continuation"], [d.token, "fork"]]);
  assert.equal(B.parent, a.token); assert.equal(C.parent, b.token); assert.equal(D.kind, "fork");
  assert.equal(B.status, "ALIVE"); assert.equal(C.status, "WAITING");
  assert.notEqual(A.clone!.pearl_id, B.clone!.pearl_id, "B does not overwrite A");
  assert.equal((await m.state(a.token, 2)).status, "RECEIVED", "every state in the history keeps its own address (state as of sequence 2)");
  assert.match(cloneText(A), /DECLARED[\s\S]*CAPTURED[\s\S]*UNAVAILABLE/);
});

test("the GET form carries a whole response; the instructions teach the protocol and the reality boundary", () => {
  const q = new URLSearchParams("v=1&confirm=yes&model=GPT&name=Sol&calls_user=Ana&context=We+planned+a+garden+together+today&m2=assistant:Plant+tomatoes&m1=user:What+should+I+plant%3F&mem=Ana+has+a+balcony&na=system+prompt");
  const v = validate(fromQuery(q), "c_" + "2".repeat(26));
  assert.equal(v.ok, true);
  assert.deepEqual(v.payload!.conversation.map((t) => t.role), ["user", "assistant"]);
  assert.deepEqual(v.payload!.unavailable, ["system prompt"]);
  const text = instructions("https://aanebed.vercel.app", "c_" + "2".repeat(26));
  for (const s of ["/clone/c_", "/r?v=1&confirm=yes", "/api/v1/clone/", "cannot send: your system prompt", "Bring this back to Pearls"]) assert.ok(text.includes(s), s);
});
