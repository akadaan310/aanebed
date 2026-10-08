/**
 * The CLONE YOUR AI protocol, end to end, against a running deployment:
 *   BASE_URL=https://aanebed.vercel.app npm run test:clone
 * Creates real clones, answers as an AI would (GET and POST), watches the SSE
 * stream, races five responses, branches, verifies the chain, deletes. Prints
 * one line per check; exits non-zero on any failure. Leaves nothing behind
 * (every clone it creates is deleted at the end).
 */
const BASE = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
type J = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const rows: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { rows.push([name, ok, detail]); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); };
const post = async (path: string, body: unknown, headers: Record<string, string> = {}) => { const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }); return { status: r.status, json: (await r.json().catch(() => ({}))) as J }; };
const get = async (path: string) => { const r = await fetch(BASE + path, { headers: { Accept: "application/json" } }); return { status: r.status, json: (await r.json().catch(() => ({}))) as J }; };
const answer = (token: string, ctx = "We planned a two-week trip to Lisbon and Porto together") => `/clone/${token}/r?v=1&confirm=yes&model=e2e-harness&provider=none&name=Harness&calls_user=Tester&context=${encodeURIComponent(ctx)}&m1=user:Plan+my+trip&m2=assistant:Lisbon+first&na=system+prompt`;
const cleanup: [string, string][] = [];

async function main() {
  const t0 = Date.now();
  const c = await post("/api/v1/clone", {});
  check("create", c.status === 201 && /^c_[0-9a-z]{26}$/.test(c.json.token), `${c.status} ${c.json.token ?? c.json.message}`);
  const token: string = c.json.token, key: string = c.json.owner_key; cleanup.push([token, key]);
  const proto = await fetch(`${BASE}/clone/${token}/protocol.txt`).then((r) => r.text());
  check("protocol readable by an AI", proto.includes("pearl-clone/1") && proto.includes("cannot send: your system prompt"));
  check("protocol read is recorded", (await get(`/api/v1/clone/${token}`)).json.status === "OPENED");

  // watch the stream while answering
  const ctl = new AbortController(); let streamed = "";
  const stream = fetch(`${BASE}/api/v1/clone/${token}/stream`, { signal: ctl.signal }).then(async (r) => { const rd = r.body!.getReader(); const dec = new TextDecoder(); for (;;) { const { value, done } = await rd.read(); if (done) break; streamed += dec.decode(value); if (streamed.includes('"status":"ALIVE"')) { ctl.abort(); break; } } }).catch(() => undefined);
  await new Promise((r) => setTimeout(r, 1500));

  const bad = await fetch(`${BASE}/clone/${token}/r?v=1&model=x`).then(async (r) => ({ status: r.status, text: await r.text() }));
  check("incomplete answer is refused, naming what is missing", bad.status === 422 && bad.text.includes("confirm"), `${bad.status}`);
  const t1 = Date.now();
  const ok = await fetch(BASE + answer(token)).then(async (r) => ({ status: r.status, text: await r.text() }));
  check("GET answer verifies", ok.status === 201 && ok.text.startsWith("VERIFIED"), `${ok.status} in ${Date.now() - t1} ms`);
  const replay = await fetch(BASE + answer(token)).then((r) => r.text());
  check("replay changes nothing", replay.startsWith("ALREADY VERIFIED"));
  const other = await fetch(BASE + answer(token, "a different session entirely, sent later")).then((r) => r.status);
  check("a different answer after cloning is refused (409)", other === 409);
  await Promise.race([stream, new Promise((r) => setTimeout(r, 12_000))]); ctl.abort();
  check("SSE stream delivered the living state", streamed.includes('"status":"ALIVE"'), `${streamed.length} bytes`);

  const st = (await get(`/api/v1/clone/${token}`)).json;
  check("state is ALIVE with a classified clone", st.status === "ALIVE" && st.clone?.declared?.source?.model === "e2e-harness" && st.clone?.unavailable?.some((u: string) => u.includes("system prompt")));
  check("event chain", st.events.map((e: J) => e.type).join(",") === "CREATED,PROTOCOL_READ,RESPONSE_REJECTED,RESPONSE_RECEIVED,VERIFIED", st.events.map((e: J) => e.type).join(","));
  const v = (await get(`/api/v1/clone/${token}/verify`)).json;
  check("chain recomputes intact", v.chain_intact === true, `head ${String(v.head).slice(0, 12)}`);
  const moment = await fetch(`${BASE}/clone/${token}/3`).then((r) => r.status);
  check("each event has an address", moment === 200);

  // concurrency: five answers race for one fresh clone
  const r2 = await post("/api/v1/clone", {}); cleanup.push([r2.json.token, r2.json.owner_key]);
  const race = await Promise.all([1, 2, 3, 4, 5].map((i) => post(`/api/v1/clone/${r2.json.token}/events`, { protocol: "pearl-clone/1", token: r2.json.token, confirm: "yes", source: { model: `racer-${i}` }, context: `racer ${i} answering at the same moment as the others` })));
  const s2 = (await get(`/api/v1/clone/${r2.json.token}`)).json;
  check("five racing answers: exactly one cloned", race.filter((x) => x.json.outcome === "verified").length === 1 && s2.events.filter((e: J) => e.type === "VERIFIED").length === 1, race.map((x) => x.status).join(","));
  check("chain intact after the race", (await get(`/api/v1/clone/${r2.json.token}/verify`)).json.chain_intact === true);

  // branches
  const cont = await post(`/api/v1/clone/${token}/children`, { kind: "continuation" }); cleanup.push([cont.json.token, cont.json.owner_key]);
  const fork = await post(`/api/v1/clone/${token}/children`, { kind: "fork" }); cleanup.push([fork.json.token, fork.json.owner_key]);
  const parent = (await get(`/api/v1/clone/${token}`)).json;
  check("continue and clone again branch from the parent", cont.status === 201 && fork.status === 201 && parent.children.map((x: J) => x.kind).join(",") === "continuation,fork");
  const childProto = await fetch(`${BASE}/clone/${cont.json.token}/protocol.txt`).then((r) => r.text());
  check("the continuation tells the next AI to read the parent clone", childProto.includes(`/clone/${token}/clone.txt`));
  const clone2 = await fetch(BASE + answer(cont.json.token, "the second AI continued the trip plan after reading clone A")).then((r) => r.status);
  check("a clone of a clone verifies", clone2 === 201);

  // security
  check("unknown address is 404", (await get(`/api/v1/clone/c_${"0".repeat(26)}`)).status === 404);
  check("path tricks are 404", (await get(`/api/v1/clone/..%2F..%2Fetc`)).status === 404);
  const big = await post(`/api/v1/clone/${r2.json.token}/events`, { protocol: "pearl-clone/1", confirm: "yes", context: "x".repeat(70_000) });
  check("oversized answer is refused", big.status === 413, `${big.status}`);
  const cross = await post("/api/v1/clone", {}, { Origin: "https://evil.example" });
  check("cross-site create is refused", cross.status === 403);
  const wrong = await fetch(`${BASE}/api/v1/clone/${token}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_key: "k_wrong" }) });
  check("delete without the owner key is refused", wrong.status === 403);

  // cleanup = deletion test
  let deleted = 0;
  for (const [t, k] of cleanup) { const r = await fetch(`${BASE}/api/v1/clone/${t}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_key: k }) }); if (r.ok) deleted++; }
  const after = (await get(`/api/v1/clone/${token}`)).json;
  check("owner deletion removes the material", deleted === cleanup.length && after.status === "DELETED" && after.events.length === 0, `${deleted}/${cleanup.length}`);
  const late = await fetch(BASE + answer(token)).then((r) => r.status);
  check("a deleted address accepts nothing", late === 410);
  console.log(`\n${rows.filter((r) => r[1]).length}/${rows.length} passed against ${BASE} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (rows.some((r) => !r[1])) process.exit(1);
}
main().catch(async (e) => { console.error(e); for (const [t, k] of cleanup) await fetch(`${BASE}/api/v1/clone/${t}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_key: k }) }).catch(() => 0); process.exit(1); });
