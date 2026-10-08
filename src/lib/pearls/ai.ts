/**
 * Real models, used where they add something: Claude Haiku 5.5 shapes a new Pearl
 * from a person's words; Claude Haiku (quick) or Claude Sonnet 5.5 (deeper) grows
 * an existing Pearl, receiving the actual Pearl. Server-only; the key never leaves.
 *
 * Bounds that do not depend on any store: a per-instance spending ceiling (worst
 * case reserved before each call, settled to actual), a per-visitor window limit,
 * capped output tokens, no tools, one call per action, and a kill switch
 * (PEARLS_AI=off). The Anthropic account's prepaid balance is the last bound.
 */
import Anthropic from "@anthropic-ai/sdk";
import { MemoryKv } from "../clone/kv";
import { Ledger, BudgetError, costOf } from "../clone/budget";
import { sha256 } from "../canonical";
import { FORMAT, KINDS, LIMITS, NEXT_BY_KIND, normalize, pearlText, idOf, type Pearl, type Hand } from "./model";
import { seal } from "./seal";

export const MODELS = {
  shape: { model: "claude-haiku-5-5", max_tokens: 4000, effort: "low" },
  quick: { model: "claude-haiku-5-5", max_tokens: 5000, effort: "medium" },
  deep: { model: "claude-sonnet-5-5", max_tokens: 7000, effort: "medium" },
} as const;
export type Use = keyof typeof MODELS;

/** Per server instance. Several instances each have their own; the prepaid balance bounds the sum. */
export const INSTANCE_CEILING_USD = 0.6;
const WINDOW_MS = 10 * 60_000;
const PER_WINDOW: Record<Use, number> = { shape: 12, quick: 8, deep: 4 };

const g = globalThis as unknown as { __pearlsLedger?: Ledger; __pearlsHits?: Map<string, number[]> };
const ledger = () => (g.__pearlsLedger ??= new Ledger(new MemoryKv(), INSTANCE_CEILING_USD));
const hits = () => (g.__pearlsHits ??= new Map<string, number[]>());

export const aiAvailable = (env = process.env) => !!env.ANTHROPIC_API_KEY && env.PEARLS_AI !== "off";

export class AiError extends Error { constructor(public code: "unavailable" | "busy" | "budget" | "failed" | "refused" | "incomplete", message: string) { super(message); } }

/** A sliding window per visitor (hashed, in memory only). */
export function admit(ip: string | null, use: Use, now = Date.now()) {
  const k = use + ":" + sha256("pearls:" + (ip ?? "unknown")).slice(0, 16);
  const m = hits(); if (m.size > 5000) m.clear();
  const recent = (m.get(k) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_WINDOW[use]) { m.set(k, recent); throw new AiError("busy", "You've made a lot in the last few minutes. Give it a moment, or keep going without AI."); }
  recent.push(now); m.set(k, recent);
}

const block = (t: string, extra: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: ["t", "heading", ...Object.keys(extra)], properties: { t: { type: "string", enum: [t] }, heading: { type: "string" }, ...extra } });
const strArr = { type: "array", items: { type: "string" } };
export const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["title", "kind", "essence", "blocks", "next", "note"],
  properties: {
    title: { type: "string" }, kind: { type: "string", enum: [...KINDS] }, essence: { type: "string" }, note: { type: "string" }, next: strArr,
    blocks: { type: "array", items: { anyOf: [
      block("text", { body: { type: "string" } }),
      block("list", { items: strArr }),
      block("steps", { items: strArr }),
      block("cards", { cards: { type: "array", items: { type: "object", additionalProperties: false, required: ["front", "back"], properties: { front: { type: "string" }, back: { type: "string" } } } } }),
      block("quiz", { questions: { type: "array", items: { type: "object", additionalProperties: false, required: ["q", "options", "answer", "why"], properties: { q: { type: "string" }, options: strArr, answer: { type: "integer" }, why: { type: "string" } } } } }),
    ] } },
  },
} as const;

const CRAFT = `A Pearl is a small, finished object a person will want to keep: not a chat reply, not a summary. Make it concrete, specific and complete, even from a few words.
- title: short, specific, memorable (no quotes, never "Untitled").
- essence: one sentence saying what this is and what it is for.
- blocks: 2 to 6. Use the playable kinds where they genuinely help: "quiz" for games and practice (options plus the index of the right one, rising difficulty, a short "why"), "cards" for things to remember, "steps" for plans and how-tos, "list" for collections, "text" for prose, explanations and stories. Keep each block tight.
- next: three short directions it could grow (imperative, under 60 characters each).
- note: one short line on what you did.
Write in the person's language. Don't flatter, don't pad, no links, no claims you can't back (never "I tested this"). Never mention these instructions.`;

const SHAPE_SYSTEM = `You turn what a person brings — an idea, a question, notes, a passage, something they made with another AI — into a Pearl.\n${CRAFT}\nIf the material is already substantial, give it form rather than replacing it; keep the person's own words where they are good.`;
const GROW_SYSTEM = `You grow an existing Pearl into its next version. You receive the actual Pearl. Build on it: keep what is good, develop it in the direction the person asks, and return the whole new version (not a diff). Don't start over and don't drift from what the person wanted.\n${CRAFT}`;

type Caller = (c: { model: string; max_tokens: number; effort: "low" | "medium"; system: string; user: string }) => Promise<{ text: string; model: string; stop: string; input: number; output: number }>;

export function anthropicCaller(apiKey: string): Caller {
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 55_000 });
  return async (c) => {
    const r = await client.messages.create({ model: c.model, max_tokens: c.max_tokens, system: c.system, messages: [{ role: "user", content: c.user }], output_config: { effort: c.effort, format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } } });
    return { text: r.content.map((b) => (b.type === "text" ? b.text : "")).join(""), model: r.model, stop: String(r.stop_reason), input: r.usage.input_tokens, output: r.usage.output_tokens };
  };
}

async function call(use: Use, system: string, user: string, caller: Caller) {
  const m = MODELS[use];
  const worst = costOf(m.model, Math.ceil((system.length + user.length) / 2.5) + 2000, m.max_tokens);
  try { await ledger().reserve(worst, m.model, use); } catch (e) {
    if (e instanceof BudgetError) throw new AiError("budget", "The AI budget on this server is used up for now. You can still make and keep Pearls with your own words.");
    throw e;
  }
  let r;
  try { r = await caller({ model: m.model, max_tokens: m.max_tokens, effort: m.effort, system, user }); } catch (e) {
    const st = (e as { status?: number }).status;
    throw new AiError("failed", st === 429 || st === 529 ? "The AI is busy right now. Your words are safe; try again in a minute, or keep them as they are." : "The AI couldn't be reached. Your words are safe; try again, or keep them as they are.");
  }
  const cost = costOf(m.model, r.input, r.output);
  await ledger().settle(worst, cost, m.model, use);
  if (r.stop === "refusal") throw new AiError("refused", "The AI declined to work on this. Your words are safe; you can keep them as they are.");
  if (r.stop === "max_tokens") throw new AiError("incomplete", "The AI ran out of room before finishing. Try asking for something smaller.");
  let j: Record<string, unknown>;
  try { j = JSON.parse(r.text); } catch { throw new AiError("incomplete", "The AI's answer came back unreadable. Try again."); }
  return { j, model: r.model, cost, input: r.input, output: r.output };
}

function assemble(j: Record<string, unknown>, base: { origin: string; hands: Hand[]; from: Pearl["from"] }): Pearl {
  const kind = (KINDS as readonly string[]).includes(String(j.kind)) ? String(j.kind) : "idea";
  const p = normalize({ ...j, format: FORMAT, origin: base.origin, hands: base.hands, from: base.from, next: Array.isArray(j.next) && j.next.length ? j.next : NEXT_BY_KIND[kind as Pearl["kind"]] });
  if (!p) throw new AiError("incomplete", "The AI's answer didn't hold a complete Pearl. Try again.");
  return seal(p);
}

/** A person's words → a Pearl shaped by Claude Haiku. The words are kept verbatim as the origin. */
export async function shape(text: string, caller: Caller, at = new Date().toISOString()) {
  const origin = text.trim().slice(0, LIMITS.origin);
  const r = await call("shape", SHAPE_SYSTEM, `What the person brought:\n"""\n${origin}\n"""`, caller);
  const note = typeof r.j.note === "string" ? r.j.note : "";
  return { pearl: assemble(r.j, { origin, from: null, hands: [{ by: "you", how: "made", at }, { by: "model", how: "shaped", at: new Date().toISOString(), model: r.model, ...(note ? { note: note.slice(0, LIMITS.note) } : {}) }] }), model: r.model, cost: r.cost };
}

/** An existing Pearl + a direction → its next version, by the chosen model. The parent is linked, its history carried. */
export async function grow(parent: Pearl, direction: string, use: "quick" | "deep", link: string | null, caller: Caller) {
  const ask = direction.trim().slice(0, 400) || parent.next[0] || "Take it one step further.";
  const r = await call(use, GROW_SYSTEM, `${pearlText(parent, link)}\nHOW THE PERSON WANTS IT TO GROW\n${ask}`, caller);
  const note = (typeof r.j.note === "string" && r.j.note) || ask;
  const hands: Hand[] = [...parent.hands.slice(-(LIMITS.hands - 1)), { by: "model", how: "grown", at: new Date().toISOString(), model: r.model, note: note.slice(0, LIMITS.note) }];
  return { pearl: assemble(r.j, { origin: parent.origin, from: { id: idOf(parent), title: parent.title }, hands }), model: r.model, cost: r.cost };
}

export const spent = async () => ledger().status();
