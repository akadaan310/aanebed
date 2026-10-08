/**
 * The final empirical experiment, against a deployed site (production by default).
 *
 *   HUMAN → CLONE → Claude Haiku 5.5 → PEARL A → CONTINUE → Claude Sonnet 5.5 → PEARL B → HUMAN
 *   and reversed: Sonnet → PEARL C → Haiku → PEARL D
 *
 * Every model call is made by the deployed server with its own key; this script
 * never holds a credential. It records what happened — including failures — in
 * verification/anthropic-experiment.json. The protocol is not changed during the run.
 *
 *   BASE_URL=https://aanebed.vercel.app npx tsx scripts/anthropic-experiment.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = (process.env.BASE_URL ?? "https://aanebed.vercel.app").replace(/\/$/, "");
const ASK = "Write the first four lines of a short poem about a lighthouse keeper who leaves notes for whoever comes after. Leave one open thread for the next intelligence to pick up.";
type Row = { step: string; ok: boolean; detail: string };
const rows: Row[] = [];
const bodies: string[] = [];
const rec = (step: string, ok: boolean, detail: string) => { rows.push({ step, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${step} — ${detail}`); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function http(path: string, init: RequestInit = {}): Promise<{ status: number; text: string; json: any }> {
  for (let i = 0; i < 6; i++) {
    const res = await once(path, init);
    if (res.status !== 429) return res;
    await sleep(15_000); // the site's own per-client rate limit: wait, never bypass
  }
  return once(path, init);
}
async function once(path: string, init: RequestInit = {}) {
  const r = await fetch(BASE + path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const text = await r.text(); bodies.push(text);
  let json: any = null; try { json = JSON.parse(text); } catch { /* text */ }
  return { status: r.status, text, json };
}
type State = any;
async function waitVisit(token: string, label: string): Promise<State> {
  const t0 = Date.now();
  for (;;) {
    const s = (await http(`/api/v1/clone/${token}`)).json;
    if (s?.visitor && s.visitor.state !== "visiting") return s;
    if (Date.now() - t0 > 200_000) { rec(`${label}: visit finished`, false, "no outcome after 200 s"); return s; }
    await sleep(2500);
  }
}
const summary = (s: State) => s?.visitor ? s.visitor.replies.map((r: any) => ({ attempt: r.attempt, model_observed: r.model_observed, message_id: r.message_id, stop_reason: r.stop_reason, input_tokens: r.input_tokens, output_tokens: r.output_tokens, cost_usd: r.cost_micro_usd / 1e6, seconds: r.ms / 1000, found_response: r.found_response ?? null })) : [];

/** One visit: invite → wait → check what arrived. Returns the final state. */
async function visit(label: string, token: string, owner: string, visitor: "haiku" | "sonnet", ask: string, expectModel: string, parent?: State) {
  const inv = await http(`/api/v1/clone/${token}/invite`, { method: "POST", body: JSON.stringify({ owner_key: owner, visitor, ask }) });
  rec(`${label}: invitation accepted`, inv.status === 202, `HTTP ${inv.status} ${inv.json?.label ?? inv.json?.message ?? ""}`);
  if (inv.status !== 202) return null;
  const s = await waitVisit(token, label);
  const replies = s.visitor.replies;
  rec(`${label}: the real model replied`, replies.length > 0, replies.length ? `${replies.length} call(s); observed model ${replies.map((r: any) => r.model_observed).join(", ")}; stop ${replies.map((r: any) => r.stop_reason).join(", ")}` : `no reply: ${s.visitor.failed ?? s.visitor.state}`);
  rec(`${label}: observed model is ${expectModel}`, replies.length > 0 && replies.every((r: any) => String(r.model_observed).startsWith(expectModel)), replies.map((r: any) => r.model_observed).join(", ") || "—");
  rec(`${label}: participated in the protocol (became ALIVE)`, s.status === "ALIVE", `status ${s.status}; ${s.rejections.length} incomplete response(s)${s.rejections.length ? ": " + s.rejections.map((r: any) => [...r.missing, ...r.problems].join("; ")).join(" | ") : ""}`);
  if (s.clone) {
    rec(`${label}: Pearl created`, /^p_[0-9a-z]{16}$/.test(s.clone.pearl_id), `${s.clone.pearl_id}; ${s.clone.captured.conversation.length} turns captured; declared model "${s.clone.declared.source.model ?? "—"}"; ${s.clone.declared.threads.length} open thread(s)`);
    rec(`${label}: system prompt etc. listed UNAVAILABLE`, s.clone.unavailable.length >= 4, `${s.clone.unavailable.length} items`);
  }
  if (parent) rec(`${label}: received the previous Pearl through the substrate`, s.visitor.read_parent === parent.token && s.parent === parent.token, `read_parent ${s.visitor.read_parent}`);
  const v = await http(`/api/v1/clone/${token}/verify`);
  rec(`${label}: event chain intact`, v.json?.chain_intact === true, `${s.sequence} events: ${s.events.map((e: any) => e.type).join(" → ")}`);
  const vt = await http(`/clone/${token}/visit.txt`);
  rec(`${label}: visit.txt rebuilds exactly what the model received`, vt.status === 200 && vt.text.includes("MATCH"), vt.text.split("\n")[2]?.slice(0, 120) ?? "");
  return s;
}

async function lineage(name: string, first: "haiku" | "sonnet", second: "haiku" | "sonnet") {
  const M = { haiku: "claude-haiku-5-5", sonnet: "claude-sonnet-5-5" };
  const a = await http("/api/v1/clone", { method: "POST", body: "{}" });
  rec(`${name} A: clone created`, a.status === 201, a.json?.token ?? `HTTP ${a.status}`);
  const pt = await http(`/clone/${a.json.token}/protocol.txt`);
  rec(`${name} A: protocol readable`, pt.status === 200 && pt.text.includes("pearl-clone/1"), `${pt.text.length} chars`);
  const A = await visit(`${name} A (${first})`, a.json.token, a.json.owner_key, first, ASK, M[first]);
  if (!A || A.status !== "ALIVE") return { A, B: null };
  const ch = await http(`/api/v1/clone/${A.token}/children`, { method: "POST", body: JSON.stringify({ kind: "continuation" }) });
  rec(`${name} B: continuation address created`, ch.status === 201, ch.json?.token ?? `HTTP ${ch.status}`);
  const B = await visit(`${name} B (${second}, handoff)`, ch.json.token, ch.json.owner_key, second, "", M[second], A);
  const Aafter = (await http(`/api/v1/clone/${A.token}`)).json;
  rec(`${name}: parent unchanged except the CONTINUED event`, Aafter.clone?.pearl_id === A.clone.pearl_id && Aafter.children.some((c: any) => c.token === ch.json.token), `A still ${Aafter.clone?.pearl_id}; children ${Aafter.children.length}`);
  return { A, B, ownerA: a.json.owner_key, ownerB: ch.json.owner_key };
}

async function main() {
  const t0 = Date.now();
  const before = (await http("/api/v1/visitors")).json;
  rec("visitors available", before?.available === true, JSON.stringify(before?.budget ?? before));
  if (!before?.available) { finish(t0, before, null, null, null); return; }

  const L1 = await lineage("Lineage 1", "haiku", "sonnet");
  const L2 = await lineage("Lineage 2 (reversed)", "sonnet", "haiku");

  // K–M: the state survives reloads and other clients
  if (L1.B) {
    const p1 = await fetch(`${BASE}/clone/${L1.B.token}`).then((r) => r.text());
    const p2 = await fetch(`${BASE}/clone/${L1.B.token}`, { headers: { "User-Agent": "a-different-client/1" } }).then((r) => r.text());
    bodies.push(p1, p2);
    const s2 = (await http(`/api/v1/clone/${L1.B.token}`)).json;
    rec("reload and another client see the same state", p1.includes("It left this here") && p2.includes("It left this here") && s2.head === L1.B.head, `head ${String(s2.head).slice(0, 12)}…`);
    const ct = await http(`/clone/${L1.B.token}/clone.txt`);
    rec("machine-readable clone.txt of the handoff Pearl", ct.status === 200 && ct.text.includes("CAPTURED") && ct.text.includes("UNAVAILABLE"), `${ct.text.length} chars`);
  }
  const llms = await http("/llms.txt");
  rec("llms.txt teaches clone.txt and visit.txt", llms.text.includes("/clone.txt") && llms.text.includes("visit.txt"), "");
  const caps = await http("/capabilities.json");
  rec("capabilities list the invitation honestly", JSON.stringify(caps.json).includes("/invite"), "");

  // security
  if (L1.A) {
    const fresh = await http("/api/v1/clone", { method: "POST", body: "{}" });
    const noOwner = await http(`/api/v1/clone/${fresh.json.token}/invite`, { method: "POST", body: JSON.stringify({ owner_key: "k_wrong", visitor: "haiku" }) });
    rec("invite without the owner key is refused", noOwner.status === 403, `HTTP ${noOwner.status}`);
    const xsite = await http(`/api/v1/clone/${fresh.json.token}/invite`, { method: "POST", headers: { Origin: "https://evil.example" }, body: JSON.stringify({ owner_key: fresh.json.owner_key, visitor: "haiku" }) });
    rec("cross-site invite is refused", xsite.status === 403, `HTTP ${xsite.status}`);
    const again = await http(`/api/v1/clone/${L1.A.token}/invite`, { method: "POST", body: JSON.stringify({ owner_key: L1.ownerA, visitor: "sonnet" }) });
    rec("a Pearl takes one invitation only", again.status === 409, `HTTP ${again.status} ${again.json?.error}`);
    const cross = await http(`/api/v1/clone/${fresh.json.token}/events`, { method: "POST", body: JSON.stringify({ protocol: "pearl-clone/1", token: L1.A.token, confirm: "yes", context: "a response written for another Pearl entirely" }) });
    rec("a response for another Pearl is refused", cross.status === 422 && JSON.stringify(cross.json.problems).includes("different clone token"), `HTTP ${cross.status}`);
    await http(`/api/v1/clone/${fresh.json.token}`, { method: "DELETE", body: JSON.stringify({ owner_key: fresh.json.owner_key }) });
  }

  // P: deletion removes what a real AI left
  const d = await http("/api/v1/clone", { method: "POST", body: "{}" });
  const D = await visit("Deletion probe (haiku)", d.json.token, d.json.owner_key, "haiku", "Say one sentence about the sea.", "claude-haiku-5-5");
  const bad = await http(`/api/v1/clone/${d.json.token}`, { method: "DELETE", body: JSON.stringify({ owner_key: "k_wrong" }) });
  rec("delete with a wrong key is refused", bad.status === 403, `HTTP ${bad.status}`);
  const del = await http(`/api/v1/clone/${d.json.token}`, { method: "DELETE", body: JSON.stringify({ owner_key: d.json.owner_key }) });
  const after = (await http(`/api/v1/clone/${d.json.token}`)).json;
  const vt = await http(`/clone/${d.json.token}/visit.txt`);
  rec("owner deletion removes the AI's material", del.status === 200 && after.status === "DELETED" && after.events.length === 0 && vt.status === 404, `${D ? "visited, " : ""}DELETE ${del.status}; state ${after.status}; visit.txt ${vt.status}`);

  finish(t0, before, L1, L2, (await http("/api/v1/visitors")).json);
}

function finish(t0: number, before: any, L1: any, L2: any, afterV: any) {
  // R: no credential in anything this script received, HTML and JSON alike
  const leak = bodies.some((b) => /sk-ant-[A-Za-z0-9_-]{8,}|ANTHROPIC_API_KEY=|BLOB_READ_WRITE_TOKEN=vercel/.test(b));
  rec("no credential appears in any response", !leak, `${bodies.length} responses scanned`);
  const spent = afterV?.budget && before?.budget ? afterV.budget.spent_usd - before.budget.spent_usd : null;
  const out = {
    base: BASE, at: new Date().toISOString(), seconds: (Date.now() - t0) / 1000, ask: ASK,
    passed: `${rows.filter((r) => r.ok).length}/${rows.length}`,
    budget_before: before?.budget ?? null, budget_after: afterV?.budget ?? null, spent_usd_this_run: spent,
    lineages: [L1, L2].filter(Boolean).map((L: any) => ({ A: L.A && { token: L.A.token, status: L.A.status, pearl: L.A.clone?.pearl_id, declared_model: L.A.clone?.declared.source.model, calls: summary(L.A) }, B: L.B && { token: L.B.token, status: L.B.status, parent: L.B.parent, pearl: L.B.clone?.pearl_id, declared_model: L.B.clone?.declared.source.model, calls: summary(L.B) } })),
    rows,
  };
  mkdirSync("verification", { recursive: true });
  writeFileSync("verification/anthropic-experiment.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`\n${out.passed} passed · spent US$${spent?.toFixed(5) ?? "?"} · ${out.seconds.toFixed(0)} s · verification/anthropic-experiment.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
