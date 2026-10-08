/**
 * A hard spending ceiling for real AI visits, kept as an append-only ledger in
 * the clone store. Every call to a paid model first RESERVES its worst case
 * (input estimate + max output), then SETTLES to the actual usage. Entry n
 * carries the running total, and a sequence number can be taken only once
 * (create-if-absent), so two simultaneous reservations can never both slip
 * under the ceiling. When the ceiling is reached the server refuses to call.
 */
import type { Kv } from "./kv";

/** US$ per million tokens (Anthropic list prices; Haiku 5.5 for prompts up to 100K tokens). */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.10, output: 0.50 },
  "claude-sonnet-5-5": { input: 2.0, output: 10.0 },
};
/** The ceiling can be lowered with ANTHROPIC_BUDGET_USD; it can never be raised above this. */
export const HARD_CEILING_USD = 4.5;
export const MAX_CALLS = 1500;

export const costOf = (model: string, input: number, output: number) => {
  const p = PRICES[model];
  if (!p) throw new Error(`no price for ${model}`);
  return (input * p.input + output * p.output) / 1e6;
};

export function ceiling(env: Record<string, string | undefined> = process.env): number {
  const v = Number(env.ANTHROPIC_BUDGET_USD);
  return Number.isFinite(v) && v >= 0 ? Math.min(v, HARD_CEILING_USD) : HARD_CEILING_USD;
}

export interface Entry { seq: number; at: string; kind: "genesis" | "reserve" | "settle"; usd: number; total: number; calls: number; model: string; clone: string }
export class BudgetError extends Error { constructor(public code: "budget_spent" | "too_many_calls" | "contention", message: string) { super(message); } }

const PREFIX = "budget/anthropic/";
const key = (n: number) => `${PREFIX}${String(n).padStart(7, "0")}.json`;

export class Ledger {
  constructor(private kv: Kv, private cap = ceiling(), private now: () => Date = () => new Date()) {}

  /**
   * The newest entry. The listing is a hint that may lag; exact keys are probed forward from it until the first gap.
   * The ledger starts with a zero genesis entry (seq 0), written without reading, so the prefix is never empty.
   * Any read error propagates: the ledger fails closed, it never reads as "nothing spent".
   */
  async tip(): Promise<Entry | null> {
    let listed = await this.kv.list(PREFIX);
    if (!listed.length) {
      await this.kv.create(key(0), JSON.stringify({ seq: 0, at: this.now().toISOString(), kind: "genesis", usd: 0, total: 0, calls: 0, model: "", clone: "" } satisfies Entry));
      listed = [key(0)];
    }
    let n = Number(listed.at(-1)!.slice(PREFIX.length, PREFIX.length + 7));
    const first = await this.kv.read(key(n));
    if (!first) throw new Error("budget ledger: listed entry unreadable");
    let tip: Entry | null = JSON.parse(first) as Entry;
    for (;;) {
      const raw = await this.kv.read(key(n + 1));
      if (!raw) return tip;
      tip = JSON.parse(raw) as Entry; n++;
    }
  }

  async status() {
    const t = await this.tip();
    const spent = t?.total ?? 0;
    return { ceiling_usd: this.cap, spent_usd: round(spent), remaining_usd: round(Math.max(0, this.cap - spent)), calls: t?.calls ?? 0, max_calls: MAX_CALLS };
  }

  private async write(kind: Entry["kind"], usd: number, model: string, clone: string, check: boolean): Promise<Entry> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const t = await this.tip();
      const total = (t?.total ?? 0) + usd, calls = (t?.calls ?? 0) + (kind === "reserve" ? 1 : 0);
      if (check && total > this.cap) throw new BudgetError("budget_spent", `The budget for real AI visits is spent (US$${round(t?.total ?? 0)} of US$${this.cap}).`);
      if (check && calls > MAX_CALLS) throw new BudgetError("too_many_calls", `The limit of ${MAX_CALLS} AI calls is reached.`);
      const e: Entry = { seq: (t?.seq ?? 0) + 1, at: this.now().toISOString(), kind, usd: round(usd), total: round(total), calls, model, clone: clone.slice(0, 7) };
      if (await this.kv.create(key(e.seq), JSON.stringify(e))) return e;
    }
    throw new BudgetError("contention", "Too many simultaneous visits; try again.");
  }

  /** Reserve the worst case before calling. Throws when it would cross the ceiling. */
  reserve(usd: number, model: string, clone: string) { return this.write("reserve", usd, model, clone, true); }
  /** Replace a reservation by what the call actually cost (a negative or zero delta). */
  settle(reserved: number, actual: number, model: string, clone: string) { return this.write("settle", actual - reserved, model, clone, false); }
}

const round = (x: number) => Math.round(x * 1e6) / 1e6;
