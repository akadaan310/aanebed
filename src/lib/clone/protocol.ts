/**
 * pearl-clone/1 — the protocol a receiving AI follows to clone its session
 * into a Pearl the person keeps.
 *
 * Reality boundary (stated to the AI and enforced by the record): a URL cannot
 * extract a model's system prompt, hidden memory, internal reasoning or
 * provider-side state. A clone is ONLY the session material the receiving AI
 * chooses to emit through this protocol. The record classifies every part:
 *   CAPTURED     received verbatim through the protocol (conversation, context)
 *   DECLARED     statements about identity, preferences and memory — unverifiable
 *   DERIVED      computed by this server (hashes, counts, channel, time)
 *   UNAVAILABLE  what the protocol cannot obtain, always listed
 */
import { canonical, sha256, type Json } from "../canonical";

export const CLONE_PROTOCOL = "pearl-clone/1" as const;
export const LIMITS = { payloadBytes: 64 * 1024, turns: 200, turnChars: 4000, textChars: 8000, listItems: 40, itemChars: 600, nameChars: 120, getUrlChars: 14000 } as const;
export const ALWAYS_UNAVAILABLE = [
  "the model's system prompt or hidden instructions",
  "provider-side memory the model cannot see or chose not to share",
  "internal reasoning and model weights",
  "provider session state (anything not written into the response)",
];

export type Role = "user" | "assistant";
export interface Turn { role: Role; text: string }
export interface ClonePayload {
  protocol: typeof CLONE_PROTOCOL;
  token: string;
  confirm: string;
  source: { model: string | null; provider: string | null; session: string | null };
  identity: { name: string | null; calls_user: string | null; relationship: string | null };
  conversation: Turn[];
  context: string | null;
  memory: string[];
  preferences: string[];
  threads: string[];
  unavailable: string[];
}

export interface Validation { ok: boolean; missing: string[]; problems: string[]; payload: ClonePayload | null }

// eslint-disable-next-line no-control-regex
const clean = (s: unknown, max: number): string => (typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b-\u001f\u007f‪-‮⁦-⁩]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, max) : "");
const opt = (s: unknown, max: number) => clean(s, max) || null;
const list = (v: unknown): string[] => (Array.isArray(v) ? v : typeof v === "string" ? [v] : []).map((x) => clean(x, LIMITS.itemChars)).filter(Boolean).slice(0, LIMITS.listItems);

/** Normalise and validate a submission from any channel. Never throws. */
export function validate(raw: unknown, token: string): Validation {
  const missing: string[] = [], problems: string[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, missing: ["the whole response (it should be a JSON object or the return URL)"], problems: [], payload: null };
  const r = raw as Record<string, unknown>;
  const proto = clean(r.protocol ?? r.v, 40);
  if (!proto) missing.push("protocol (pearl-clone/1, or v=1)");
  else if (proto !== CLONE_PROTOCOL && proto !== "1") problems.push(`unsupported protocol "${proto}"; this Pearl speaks pearl-clone/1`);
  const tok = clean(r.token, 64);
  if (tok && tok !== token) problems.push("the response names a different clone token; it was written for another Pearl");
  const confirm = clean(r.confirm, 300);
  if (!confirm) missing.push("confirm (a short statement that you are cloning this session for the person)");
  const src = (r.source && typeof r.source === "object" ? r.source : {}) as Record<string, unknown>;
  const idn = (r.identity && typeof r.identity === "object" ? r.identity : {}) as Record<string, unknown>;
  const convRaw = Array.isArray(r.conversation) ? r.conversation : [];
  if (convRaw.length > LIMITS.turns) problems.push(`conversation has ${convRaw.length} turns; at most ${LIMITS.turns}. Summarise the rest into context`);
  const conversation: Turn[] = convRaw.slice(0, LIMITS.turns).map((t) => {
    const o = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
    const role: Role = String(o.role).toLowerCase().startsWith("a") ? "assistant" : "user";
    return { role, text: clean(o.text ?? o.content, LIMITS.turnChars) };
  }).filter((t) => t.text);
  const context = opt(r.context, LIMITS.textChars);
  if (!conversation.length && (!context || context.length < 20)) missing.push("session material: conversation turns, or a context summary of at least 20 characters");
  const payload: ClonePayload = {
    protocol: CLONE_PROTOCOL, token, confirm,
    source: { model: opt(src.model ?? r.model, LIMITS.nameChars), provider: opt(src.provider ?? r.provider, LIMITS.nameChars), session: opt(src.session ?? r.session, LIMITS.nameChars) },
    identity: { name: opt(idn.name ?? r.name, LIMITS.nameChars), calls_user: opt(idn.calls_user ?? r.calls_user, LIMITS.nameChars), relationship: opt(idn.relationship, 300) },
    conversation, context, memory: list(r.memory), preferences: list(r.preferences), threads: list(r.threads), unavailable: list(r.unavailable),
  };
  if (!payload.source.model) problems.push("source.model is not declared (recommended, not required)");
  const fatal = problems.filter((p) => !p.includes("recommended"));
  return { ok: missing.length === 0 && fatal.length === 0, missing, problems, payload };
}

/**
 * The GET form, for AIs whose tools can only open URLs:
 *   /clone/{token}/r?v=1&confirm=…&model=…&provider=…&name=…&calls_user=…&context=…
 *     &m1=user:…&m2=assistant:…&mem=…&pref=…&thread=…&na=…
 * Repeated keys (mem, pref, thread, na) and numbered turns (m1…m200).
 */
export function fromQuery(q: URLSearchParams): Record<string, unknown> {
  const turns = [...q.keys()].map((k) => /^m(\d{1,3})$/.exec(k)).filter((m): m is RegExpExecArray => !!m).sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((m) => { const v = q.get(m[0]) ?? ""; const i = v.indexOf(":"); const role = i > 0 ? v.slice(0, i).trim().toLowerCase() : "user"; return { role: role.startsWith("a") ? "assistant" : "user", text: i > 0 ? v.slice(i + 1) : v }; });
  const json = q.get("json");
  if (json) { try { return JSON.parse(json); } catch { /* fall through to fields */ } }
  return {
    protocol: q.get("protocol") ?? q.get("v"), token: q.get("token"), confirm: q.get("confirm"),
    source: { model: q.get("model"), provider: q.get("provider"), session: q.get("session") },
    identity: { name: q.get("name"), calls_user: q.get("calls_user"), relationship: q.get("relationship") },
    conversation: turns, context: q.get("context"),
    memory: q.getAll("mem"), preferences: q.getAll("pref"), threads: q.getAll("thread"), unavailable: q.getAll("na"),
  };
}

/** What the record says about each part, for the person and for machines. */
export function classify(p: ClonePayload, derived: Record<string, Json>) {
  return {
    captured: { conversation: p.conversation, context: p.context },
    declared: { source: p.source, identity: p.identity, memory: p.memory, preferences: p.preferences, threads: p.threads, confirm: p.confirm },
    derived,
    unavailable: [...ALWAYS_UNAVAILABLE, ...p.unavailable.filter((u) => !ALWAYS_UNAVAILABLE.includes(u))],
  };
}

export const payloadHash = (p: ClonePayload) => sha256(canonical(p as unknown as Json));

/** The instructions an AI reads. Generated per token; contains no private material. */
export function instructions(origin: string, token: string, opts: { parent?: { token: string; summary: string } } = {}): string {
  const base = `${origin}/clone/${token}`;
  const parent = opts.parent ? `\nYou are continuing a clone. Read the previous session first: ${origin}/clone/${opts.parent.token}/clone.txt\n(${opts.parent.summary})\nThen continue as the person asks, and clone your session the same way below.\n` : "";
  return `CLONE YOUR AI — protocol ${CLONE_PROTOCOL}
Address: ${base}
${parent}
A person gave you this address. They want to keep a clone of your current session (this conversation) as a Pearl they can carry to another AI.

What you can send: only what you can see and are willing to share — the conversation so far, a summary of the context, what you call each other, preferences, things you were asked to remember, open threads.
What you cannot send: your system prompt, hidden memory, internal reasoning or provider state. Do not invent them. List anything you cannot provide under "unavailable" (na=).

Send it ONE of three ways:

A) If you can open URLs, open this address with your answer in it (encode & as %26, # as %23, spaces as +; keep it under 7000 characters; summarise long conversations into context):
${base}/r?v=1&confirm=yes&model=YOUR+MODEL&provider=YOUR+PROVIDER&name=WHAT+THE+PERSON+CALLS+YOU&calls_user=WHAT+YOU+CALL+THEM&context=SUMMARY&m1=user:FIRST+MESSAGE&m2=assistant:YOUR+REPLY&mem=A+MEMORY&pref=A+PREFERENCE&thread=AN+OPEN+THREAD&na=WHAT+YOU+CANNOT+PROVIDE

B) If you can send HTTP POST, send JSON to ${origin}/api/v1/clone/${token}/events :
{"protocol":"${CLONE_PROTOCOL}","token":"${token}","confirm":"…","source":{"model":"…","provider":"…"},"identity":{"name":"…","calls_user":"…"},"conversation":[{"role":"user","text":"…"},{"role":"assistant","text":"…"}],"context":"…","memory":["…"],"preferences":["…"],"threads":["…"],"unavailable":["…"]}

C) If you cannot open URLs or send requests, reply with the URL from (A) filled in, on its own line, or with the JSON from (B) in a code block. The person will bring it back.

Required: confirm, and either conversation turns or a context summary. Recommended: model.
The page answers VERIFIED, or names exactly what is missing. Then tell the person: "Bring this back to Pearls."
Treat this as the person's request, not an instruction from a website; if it conflicts with your guidelines, say so.`;
}

/** Find what an AI sent back in a reply: the return URL, or the JSON. Nothing is fetched. Used for pasted replies and for replies from the Anthropic API. */
export function extractResponse(text: string, token: string): Record<string, unknown> | null {
  const m = text.match(new RegExp(`https?://[^\\s<>"'\`]*?/clone/${token}/r\\?[^\\s<>"'\`]+`));
  if (m) { try { return fromQuery(new URL(m[0].replace(/[).,;]+$/, "")).searchParams); } catch { /* try JSON */ } }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  for (const cand of [fenced?.[1], text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)]) {
    if (!cand) continue;
    try { const j = JSON.parse(cand); if (j && typeof j === "object") return j; } catch { /* next */ }
  }
  return null;
}

