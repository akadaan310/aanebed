/**
 * The clone as a transition system: STATE → EVENT → TRANSITION → STATE.
 * Authoritative state is the fold of the append-only event chain stored in
 * the server's store; the browser never holds authority.
 *
 *   WAITING ─PROTOCOL_READ→ OPENED ─RESPONSE_REJECTED→ (same; missing parts named)
 *      └──────RESPONSE_RECEIVED→ RECEIVED ─VERIFIED→ ALIVE ─CONTINUED/FORKED→ ALIVE (+child)
 *   WAITING/OPENED past the time-to-live → EXPIRED.   Owner deletion → DELETED (tombstone only).
 */
import { canonical, sha256, type Json } from "../canonical";
import { PEARL_FORMAT, pearlDigest, idFromDigest, type Pearl } from "../pearl/model";
import { seal, verifyChain, type CloneEvent, type EventType } from "./chain";
import { CLONE_PROTOCOL, LIMITS, classify, payloadHash, validate, type ClonePayload } from "./protocol";
import type { Kv } from "./kv";

export const TTL_DAYS = 7;
export const MAX_REJECTIONS = 20;
export const MAX_CHILDREN = 50;
export type Status = "WAITING" | "OPENED" | "RECEIVED" | "ALIVE" | "EXPIRED" | "DELETED";
export type Kind = "origin" | "continuation" | "fork";

export interface Meta { token: string; protocol: typeof CLONE_PROTOCOL; created_at: string; owner_hash: string; parent: string | null; kind: Kind; ttl_days: number }
export interface CloneState {
  token: string; status: Status; kind: Kind; parent: string | null; created_at: string; expires_at: string | null;
  sequence: number; head: string | null;
  opened: boolean; rejections: { at: string; missing: string[]; problems: string[] }[];
  clone: (ReturnType<typeof classify> & { received_at: string; verified_at: string; pearl_id: string; digest: string; payload_hash: string }) | null;
  children: { token: string; kind: Kind; at: string }[];
  /** A real AI this server invited in (Anthropic API). OBSERVED by this server: model id returned by the API, usage, stop reason, cost, the raw reply. */
  visitor: Visitor | null;
  events: CloneEvent[];
}
export interface VisitorReply { attempt: number; final: boolean; at: string; model_observed: string; message_id: string; stop_reason: string; input_tokens: number; output_tokens: number; cost_micro_usd: number; ms: number; reply: string }
export interface Visitor { provider: "anthropic"; model: string; label: string; invited_at: string; ask: string | null; read_parent: string | null; replies: VisitorReply[]; failed: string | null; state: "visiting" | "answered" | "failed" | "lost" }
export type Channel = "direct-get" | "direct-post" | "relayed-by-person" | "anthropic-api";
/** A visit with no reply after this long is reported as lost (the server function ended before the AI answered). */
export const VISIT_LOST_MS = 120_000;
export class CloneError extends Error { constructor(public status: number, public code: string, message: string, public details: Record<string, unknown> = {}) { super(message); } }

const B32 = "0123456789abcdefghjkmnpqrstvwxyz";
export function randomToken(prefix: string, chars: number): string {
  const b = new Uint8Array(chars); crypto.getRandomValues(b);
  return prefix + [...b].map((x) => B32[x & 31]).join("");
}
export const TOKEN = /^c_[0-9abcdefghjkmnpqrstvwxyz]{26}$/;
const keyOf = { meta: (t: string) => `clones/${t}/meta.json`, ev: (t: string, s: number) => `clones/${t}/events/${String(s).padStart(6, "0")}.json`, evs: (t: string) => `clones/${t}/events/`, lock: (t: string) => `clones/${t}/lock/verified`, invited: (t: string) => `clones/${t}/lock/invited`, snap: (t: string, s: number) => `clones/${t}/snapshots/${String(s).padStart(6, "0")}.json`, tomb: (t: string) => `tombs/${t}.json`, root: (t: string) => `clones/${t}/` };

/** A continuity Pearl (pearl/1) of the clone: its content id names exactly this clone record. Built from declared/captured parts only. */
export function clonePearl(p: ClonePayload, token: string): Pearl {
  const blocks: Pearl["blocks"] = [];
  if (p.identity.name) blocks.push({ type: "c", kind: "ai", text: p.identity.name });
  if (p.identity.calls_user) blocks.push({ type: "c", kind: "human", text: p.identity.calls_user });
  if (p.context) blocks.push({ type: "c", kind: "said", text: p.context.slice(0, 1400) });
  for (const m of p.memory) blocks.push({ type: "c", kind: "mem", text: m });
  for (const t of p.threads) blocks.push({ type: "c", kind: "thread", text: t });
  for (const pr of p.preferences) blocks.push({ type: "c", kind: "nuance", text: pr });
  blocks.push({ type: "note", text: `${p.conversation.length} conversation turns captured through ${CLONE_PROTOCOL}; payload ${payloadHash(p).slice(0, 16)}` });
  return { format: PEARL_FORMAT, type: "continuity", title: `Clone of ${p.identity.name ?? p.source.model ?? "an AI session"}`, by: p.source.model, for: null, session: token, blocks: blocks.slice(0, 40) };
}

export class CloneMachine {
  constructor(private kv: Kv, private now: () => Date = () => new Date()) {}

  async create(opts: { parent?: string; kind?: Kind; source?: string } = {}): Promise<{ token: string; ownerKey: string; state: CloneState }> {
    const at = this.now().toISOString();
    let parentState: CloneState | null = null;
    if (opts.parent) {
      parentState = await this.state(opts.parent);
      if (parentState.status !== "ALIVE") throw new CloneError(409, "parent_not_alive", "A clone can only continue or branch from a living clone.");
      if (parentState.children.length >= MAX_CHILDREN) throw new CloneError(429, "too_many_children", `A Pearl can have at most ${MAX_CHILDREN} continuations.`);
    }
    const token = randomToken("c_", 26), ownerKey = randomToken("k_", 32);
    const kind: Kind = opts.parent ? (opts.kind === "fork" ? "fork" : "continuation") : "origin";
    const meta: Meta = { token, protocol: CLONE_PROTOCOL, created_at: at, owner_hash: sha256(ownerKey), parent: opts.parent ?? null, kind, ttl_days: TTL_DAYS };
    if (!(await this.kv.create(keyOf.meta(token), JSON.stringify(meta)))) throw new CloneError(500, "token_collision", "could not allocate a token");
    await this.append(token, "CREATED", { kind, parent: meta.parent, protocol: CLONE_PROTOCOL }, opts.source ?? "person");
    if (opts.parent) await this.append(opts.parent, kind === "fork" ? "FORKED" : "CONTINUED", { child: token, kind }, opts.source ?? "person");
    return { token, ownerKey, state: await this.state(token) };
  }

  private async meta(token: string): Promise<Meta | null> {
    if (!TOKEN.test(token)) return null;
    const m = await this.kv.read(keyOf.meta(token));
    return m ? (JSON.parse(m) as Meta) : null;
  }

  /** Every event, in order. The listing is a hint (it may lag); sequence keys are then read exactly until the first gap. */
  async events(token: string): Promise<CloneEvent[]> {
    const listed = (await this.kv.list(keyOf.evs(token))).filter((k) => k.endsWith(".json")).length;
    const evs = (await Promise.all(Array.from({ length: listed }, (_, i) => this.kv.read(keyOf.ev(token, i + 1))))).filter((x): x is string => !!x).map((x) => JSON.parse(x) as CloneEvent);
    for (let seq = evs.length + 1; seq < 100_000; seq++) {
      const raw = await this.kv.read(keyOf.ev(token, seq));
      if (!raw) break;
      evs.push(JSON.parse(raw) as CloneEvent);
    }
    return evs.sort((a, b) => a.sequence - b.sequence);
  }

  /** Append one event. A sequence number can be taken only once (create-if-absent); a lost race retries on the new head. */
  async append(token: string, type: EventType, payload: Json, source: string): Promise<CloneEvent> {
    for (let attempt = 0; attempt < 12; attempt++) {
      const evs = await this.events(token);
      const head = evs.at(-1) ?? null;
      const seq = (head?.sequence ?? 0) + 1;
      const e = seal(head, { sequence: seq, type, at: this.now().toISOString(), source: source.slice(0, 80), payload });
      if (await this.kv.create(keyOf.ev(token, seq), JSON.stringify(e))) return e;
    }
    throw new CloneError(503, "contention", "too many simultaneous writes; try again", { retryable: true });
  }

  async state(token: string, upTo?: number): Promise<CloneState> {
    if (!TOKEN.test(token)) throw new CloneError(404, "not_found", "That is not a clone address.");
    if (await this.kv.read(keyOf.tomb(token))) return { token, status: "DELETED", kind: "origin", parent: null, created_at: "", expires_at: null, sequence: 0, head: null, opened: false, rejections: [], clone: null, children: [], visitor: null, events: [] };
    const meta = await this.meta(token);
    if (!meta) throw new CloneError(404, "not_found", "No Pearl lives at this address.");
    const all = await this.events(token);
    return fold(meta, upTo ? all.filter((e) => e.sequence <= upTo) : all, this.now());
  }

  /** First non-browser read of the protocol: an AI (or some other client) opened the address. Recorded once, labelled as a heuristic. */
  async protocolRead(token: string, how: string): Promise<void> {
    const s = await this.state(token);
    if (s.status !== "WAITING") return;
    await this.append(token, "PROTOCOL_READ", { how }, "non-browser client (heuristic)");
  }

  async isOwner(token: string, ownerKey: unknown): Promise<boolean> {
    const meta = await this.meta(token);
    return !!meta && typeof ownerKey === "string" && sha256(ownerKey) === meta.owner_hash;
  }

  /** One invitation per address, ever: create-if-absent, so two clicks or two tabs cannot both spend. */
  async claimInvitation(token: string, model: string): Promise<boolean> { return this.kv.create(keyOf.invited(token), model); }

  async submit(token: string, raw: unknown, channel: Channel): Promise<{ status: number; outcome: "verified" | "duplicate" | "incomplete"; state: CloneState; missing?: string[]; problems?: string[] }> {
    const bytes = new TextEncoder().encode(JSON.stringify(raw ?? null)).length;
    if (bytes > LIMITS.payloadBytes) throw new CloneError(413, "too_large", `The response is ${bytes} bytes; at most ${LIMITS.payloadBytes}. Summarise long conversations into context.`);
    let s = await this.state(token);
    if (s.status === "DELETED") throw new CloneError(410, "deleted", "This Pearl was deleted by its owner.");
    if (s.status === "EXPIRED") throw new CloneError(410, "expired", "This address has expired. Start a new clone.");
    const v = validate(raw, token);
    if (s.status === "ALIVE" || s.status === "RECEIVED") {
      if (v.payload && s.clone && payloadHash(v.payload) === s.clone.payload_hash) return { status: 200, outcome: "duplicate", state: s };
      throw new CloneError(409, "already_cloned", "This Pearl already holds a clone. To add more, use its Continue address.", { continue: "POST /api/v1/clone/{token}/children" });
    }
    if (!v.ok) {
      if (s.rejections.length >= MAX_REJECTIONS) throw new CloneError(429, "too_many_attempts", "Too many incomplete responses for this address. Start a new clone.");
      await this.append(token, "RESPONSE_REJECTED", { missing: v.missing, problems: v.problems, channel }, channel);
      return { status: 422, outcome: "incomplete", state: await this.state(token), missing: v.missing, problems: v.problems };
    }
    const p = v.payload!;
    // exactly one clone per address: the first valid response takes the lock
    if (!(await this.kv.create(keyOf.lock(token), payloadHash(p)))) {
      s = await this.state(token);
      const winner = await this.kv.read(keyOf.lock(token));
      if (winner === payloadHash(p)) return { status: 200, outcome: "duplicate", state: s };
      throw new CloneError(409, "already_cloned", "Another response arrived first and was cloned. To add more, use its Continue address.");
    }
    const received = await this.append(token, "RESPONSE_RECEIVED", { channel, payload_hash: payloadHash(p), payload: p as unknown as Json }, channel);
    const pearl = clonePearl(p, token);
    const digest = pearlDigest(pearl);
    const checks = { token_matches: true, protocol: CLONE_PROTOCOL, confirm_present: true, session_material: p.conversation.length > 0 ? "conversation" : "context", declared_model: p.source.model ?? null };
    const verified = await this.append(token, "VERIFIED", { checks, payload_hash: payloadHash(p), received_event: received.sequence, pearl_id: idFromDigest(digest), digest }, "this server");
    s = await this.state(token);
    await this.kv.create(keyOf.snap(token, verified.sequence), JSON.stringify({ sequence: verified.sequence, state: { ...s, events: undefined } }));
    return { status: 201, outcome: "verified", state: s };
  }

  async remove(token: string, ownerKey: string): Promise<number> {
    const meta = await this.meta(token);
    if (!meta) throw new CloneError(404, "not_found", "No Pearl lives at this address.");
    if (typeof ownerKey !== "string" || sha256(ownerKey) !== meta.owner_hash) throw new CloneError(403, "not_owner", "Only the browser that created this Pearl can delete it.");
    const n = await this.kv.removePrefix(keyOf.root(token));
    await this.kv.create(keyOf.tomb(token), JSON.stringify({ deleted_at: this.now().toISOString() }));
    return n;
  }

  async verify(token: string) { return verifyChain(await this.events(token)); }
}

export function fold(meta: Meta, events: CloneEvent[], now: Date): CloneState {
  const s: CloneState = { token: meta.token, status: "WAITING", kind: meta.kind, parent: meta.parent, created_at: meta.created_at, expires_at: new Date(Date.parse(meta.created_at) + meta.ttl_days * 864e5).toISOString(), sequence: 0, head: null, opened: false, rejections: [], clone: null, children: [], visitor: null, events };
  let payload: ClonePayload | null = null, received_at = "", channel = "";
  for (const e of events) {
    s.sequence = e.sequence; s.head = e.hash;
    const p = e.payload as Record<string, Json>;
    if (e.type === "PROTOCOL_READ" || e.type === "INVITED") { s.opened = true; if (s.status === "WAITING") s.status = "OPENED"; }
    if (e.type === "INVITED") s.visitor = { provider: "anthropic", model: String(p.model), label: String(p.label), invited_at: e.at, ask: (p.ask as string) ?? null, read_parent: (p.read_parent as string) ?? null, replies: [], failed: null, state: "visiting" };
    if (e.type === "VISITOR_REPLIED" && s.visitor) { s.visitor.replies.push(p as unknown as VisitorReply); if (p.final) s.visitor.state = "answered"; }
    if (e.type === "VISITOR_FAILED" && s.visitor) { s.visitor.failed = String(p.reason); s.visitor.state = "failed"; }
    if (e.type === "RESPONSE_REJECTED") s.rejections.push({ at: e.at, missing: (p.missing as string[]) ?? [], problems: (p.problems as string[]) ?? [] });
    if (e.type === "RESPONSE_RECEIVED") { s.status = "RECEIVED"; payload = p.payload as unknown as ClonePayload; received_at = e.at; channel = String(p.channel); }
    if (e.type === "VERIFIED" && payload) {
      s.status = "ALIVE";
      s.clone = { ...classify(payload, { channel, received_at, verified_at: e.at, turns: payload.conversation.length, characters: payload.conversation.reduce((n, t) => n + t.text.length, 0) + (payload.context?.length ?? 0), payload_hash: String(p.payload_hash), pearl_id: String(p.pearl_id), event_chain_head: e.hash }), received_at, verified_at: e.at, pearl_id: String(p.pearl_id), digest: String(p.digest), payload_hash: String(p.payload_hash) };
    }
    if (e.type === "CONTINUED" || e.type === "FORKED") s.children.push({ token: String(p.child), kind: e.type === "FORKED" ? "fork" : "continuation", at: e.at });
  }
  if ((s.status === "WAITING" || s.status === "OPENED") && s.expires_at && now.getTime() > Date.parse(s.expires_at)) s.status = "EXPIRED";
  if (s.status === "ALIVE") s.expires_at = null;
  if (s.visitor?.state === "visiting" && now.getTime() - Date.parse(s.visitor.invited_at) > VISIT_LOST_MS) s.visitor.state = "lost";
  return s;
}

/** Plain text of a clone, for the next AI (continuation). Only what the protocol received. */
export function cloneText(s: CloneState): string {
  if (!s.clone) return `This Pearl (${s.token}) holds no clone yet: status ${s.status}.`;
  const c = s.clone;
  const d = c.declared;
  const L = [`CLONE ${s.token} — ${CLONE_PROTOCOL}`, `Verified ${c.verified_at}. Pearl ${c.pearl_id}.`, "", "DECLARED (said by the cloned AI; not verifiable):",
    `  model: ${d.source.model ?? "not declared"} · provider: ${d.source.provider ?? "not declared"}`, `  called: ${d.identity.name ?? "—"} · calls the person: ${d.identity.calls_user ?? "—"}`,
    ...d.memory.map((m) => `  memory: ${m}`), ...d.preferences.map((m) => `  preference: ${m}`), ...d.threads.map((m) => `  open thread: ${m}`), "",
    "CAPTURED (received through the protocol):", ...(c.captured.context ? [`  context: ${c.captured.context}`] : []), ...c.captured.conversation.map((t) => `  ${t.role}: ${t.text}`), "",
    "UNAVAILABLE (not in this clone):", ...c.unavailable.map((u) => `  - ${u}`)];
  return L.join("\n") + "\n";
}

export const hashOf = (x: unknown) => sha256(canonical(x as Json));
