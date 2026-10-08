/**
 * A real AI enters a clone. On the owner's request this server delivers the
 * clone's own protocol text (and, for a continuation, the previous Pearl's
 * clone.txt) to a Claude model through the Anthropic API, then submits the
 * model's reply through the same pearl-clone/1 path any AI uses. Nothing is
 * written on the model's behalf: if its reply is incomplete, the clone says so.
 *
 * Bounds: one invitation per address; at most two calls per visit (the second
 * only to relay what the Pearl said was missing); max output tokens per call;
 * the ledger's hard ceiling; no tools, so the model can only write text.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { CloneMachine } from "./machine";
import { CloneError, cloneText } from "./machine";
import { Ledger, BudgetError, costOf } from "./budget";
import { extractResponse, instructions, validate } from "./protocol";
import { sha256 } from "../canonical";

export const VISITORS = {
  haiku: { model: "claude-haiku-5-5", label: "Claude Haiku 5.5", max_tokens: 4000, effort: "medium", role: "fast" },
  sonnet: { model: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", max_tokens: 8000, effort: "medium", role: "deep" },
} as const;
export type VisitorKey = keyof typeof VISITORS;
export const VISIT_FRAME = "visit/1";
export const MAX_ATTEMPTS = 2;
export const ASK_CHARS = 600;
const REPLY_CHARS = 12_000;
/** A second call is made only if the first finished well inside the function's lifetime. */
const RETRY_BEFORE_MS = 45_000;

export interface Call { model: string; max_tokens: number; effort: "low" | "medium" | "high"; messages: { role: "user" | "assistant"; content: string }[] }
export interface Answer { text: string; model: string; id: string; stop_reason: string; input_tokens: number; output_tokens: number }
export type Caller = (c: Call) => Promise<Answer>;

export const visitorsAvailable = (env: Record<string, string | undefined> = process.env) => !!env.ANTHROPIC_API_KEY;

/** The Anthropic Messages API. The key is read on the server and never leaves it. */
export function anthropicCaller(apiKey: string): Caller {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 80_000 });
  return async (c) => {
    const r = await client.messages.create({ model: c.model, max_tokens: c.max_tokens, output_config: { effort: c.effort }, messages: c.messages });
    const text = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { text, model: r.model, id: r.id, stop_reason: String(r.stop_reason), input_tokens: r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0), output_tokens: r.usage.output_tokens };
  };
}

/** The exact text the visiting model receives. The frame is constant; the protocol and clone.txt are what any AI would read at the address. */
export function visitPrompt(o: { origin: string; token: string; ask: string; parent: { token: string; text: string } | null }): string {
  const proto = instructions(o.origin, o.token, { parent: o.parent ? { token: o.parent.token, summary: "its clone.txt is included below" } : undefined });
  return [
    `A person invited you into a Pearl on ${o.origin}. The website's server delivered this message to you through the Anthropic API, at the person's request. You have no tools here: you cannot open links or send requests, so use way C of the protocol below — answer the person, and include the JSON from way B in a code block. The website reads your reply and nothing else.`,
    "", "The person's request:", '"""', o.ask, '"""',
    ...(o.parent ? ["", `The person handed you a Pearl another AI left. Its clone.txt, exactly as ${o.origin}/clone/${o.parent.token}/clone.txt serves it:`, '"""', o.parent.text.trim(), '"""', "Pick up from it: do not start from zero."] : []),
    "", `What the address says (protocol.txt, exactly as ${o.origin}/clone/${o.token}/protocol.txt serves it):`, '"""', proto, '"""',
  ].join("\n");
}

const retryPrompt = (missing: string[], problems: string[]) => [
  "The Pearl answered: INCOMPLETE.",
  ...missing.map((x) => `Missing: ${x}`), ...problems.filter((p) => !p.includes("recommended")).map((x) => `Problem: ${x}`),
  "Send the corrected response: the JSON from way B in a code block.",
].join("\n");

export const cleanAsk = (raw: unknown, fallback: string) => (typeof raw === "string" ? raw.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, ASK_CHARS) : "") || fallback;
export const DEFAULT_ASK = { origin: "Make me something small and good that I can keep: an idea, a few lines, a plan. Then let it continue.", continuation: "Pick this up and take it one step further." };

/**
 * Begin a visit: checks, the one-invitation lock, and the INVITED event. Returns
 * the prompt to run. Called before the response is sent, so refusals are immediate.
 */
export async function beginVisit(m: CloneMachine, o: { token: string; ownerKey: unknown; visitor: VisitorKey; ask: unknown; origin: string; ledger: Ledger }) {
  const v = VISITORS[o.visitor];
  if (!v) throw new CloneError(400, "unknown_visitor", "Choose haiku or sonnet.");
  if (!(await m.isOwner(o.token, o.ownerKey))) throw new CloneError(403, "not_owner", "Only the browser that created this Pearl can invite an AI into it.");
  const s = await m.state(o.token);
  if (s.status !== "WAITING" && s.status !== "OPENED") throw new CloneError(409, "not_waiting", s.status === "ALIVE" ? "This Pearl already holds a clone. Hand it on with Continue." : `This Pearl is ${s.status.toLowerCase()}.`);
  const b = await o.ledger.status();
  if (b.remaining_usd < 0.1) throw new CloneError(402, "budget_spent", `The budget for real AI visits is spent (US$${b.spent_usd} of US$${b.ceiling_usd}). You can still give the address to any AI yourself.`);
  if (!(await m.claimInvitation(o.token, v.model))) throw new CloneError(409, "already_invited", "An AI was already invited into this Pearl. Each address takes one invitation.");
  const parent = s.parent ? await m.state(s.parent) : null;
  const ask = cleanAsk(o.ask, s.parent ? DEFAULT_ASK.continuation : DEFAULT_ASK.origin);
  const prompt = visitPrompt({ origin: o.origin, token: o.token, ask, parent: parent ? { token: parent.token, text: cloneText(parent) } : null });
  await m.append(o.token, "INVITED", { provider: "anthropic", model: v.model, label: v.label, ask, read_parent: parent?.token ?? null, frame: VISIT_FRAME, prompt_sha256: sha256(prompt), prompt_chars: prompt.length, max_tokens: v.max_tokens, effort: v.effort }, "the owner, through this server");
  return { prompt, v };
}

/** Run the visit to its end. Every outcome — arrival, incomplete reply, refusal, unreachable API, spent budget — becomes an event. */
export async function runVisit(m: CloneMachine, o: { token: string; prompt: string; v: (typeof VISITORS)[VisitorKey]; ledger: Ledger; caller: Caller; now?: () => number }) {
  const now = o.now ?? Date.now, t0 = now();
  const messages: Call["messages"] = [{ role: "user", content: o.prompt }];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const chars = messages.reduce((n, x) => n + x.content.length, 0);
    const worst = costOf(o.v.model, Math.ceil(chars / 2.5) + 50, o.v.max_tokens);
    try { await o.ledger.reserve(worst, o.v.model, o.token); } catch (e) {
      await m.append(o.token, "VISITOR_FAILED", { reason: e instanceof BudgetError ? e.message : "The budget ledger could not be written.", attempt }, "this server");
      return;
    }
    const c0 = now();
    let a: Answer;
    try { a = await o.caller({ model: o.v.model, max_tokens: o.v.max_tokens, effort: o.v.effort, messages }); } catch (e) {
      // the reservation is kept: a failed or timed-out call is counted at its worst case
      const status = (e as { status?: number }).status;
      await m.append(o.token, "VISITOR_FAILED", { reason: `The AI could not be reached${status ? ` (HTTP ${status})` : ""}.`, attempt }, "this server");
      return;
    }
    const cost = costOf(o.v.model, a.input_tokens, a.output_tokens);
    await o.ledger.settle(worst, cost, o.v.model, o.token);
    const body = extractResponse(a.text, o.token);
    const ok = validate(body, o.token).ok;
    const final = ok || attempt === MAX_ATTEMPTS || a.stop_reason === "refusal" || now() - t0 > RETRY_BEFORE_MS;
    await m.append(o.token, "VISITOR_REPLIED", { attempt, final, at: new Date().toISOString(), model_observed: a.model, message_id: a.id, stop_reason: a.stop_reason, input_tokens: a.input_tokens, output_tokens: a.output_tokens, cost_micro_usd: Math.round(cost * 1e6), ms: now() - c0, found_response: !!body, reply: a.text.slice(0, REPLY_CHARS) }, `${a.model} via the Anthropic API`);
    let r;
    try { r = await m.submit(o.token, body, "anthropic-api"); } catch (e) {
      if (e instanceof CloneError) return; // e.g. someone else's response was cloned first: the chain already says so
      throw e;
    }
    if (r.outcome !== "incomplete" || final) return;
    messages.push({ role: "assistant", content: a.text || "(no text)" }, { role: "user", content: retryPrompt(r.missing ?? [], r.problems ?? []) });
  }
}
