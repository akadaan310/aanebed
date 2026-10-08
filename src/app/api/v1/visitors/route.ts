import { jsonRes } from "@/lib/clone/server";
import { getKv } from "@/lib/clone/kv";
import { Ledger, PRICES } from "@/lib/clone/budget";
import { VISITORS, visitorsAvailable, MAX_ATTEMPTS } from "@/lib/clone/visitor";

export const dynamic = "force-dynamic";

/** GET — which real AIs this deployment can invite, and how much of the visit budget is left. Public: it holds no secrets. */
export async function GET() {
  const kv = await getKv();
  let budget = null, problem: string | null = null;
  try { budget = kv ? await new Ledger(kv).status() : null; } catch (e) { problem = "the budget ledger could not be read, so no visit can be paid for"; console.log(JSON.stringify({ evt: "visitors.ledger_error", message: (e as Error).message?.slice(0, 160) })); }
  return jsonRes(200, {
    available: visitorsAvailable() && !!budget && budget.remaining_usd >= 0.1,
    provider: "anthropic",
    visitors: Object.entries(VISITORS).map(([k, v]) => ({ key: k, model: v.model, label: v.label, role: v.role, max_output_tokens: v.max_tokens, price_usd_per_million: PRICES[v.model] })),
    bounds: { invitations_per_address: 1, calls_per_visit: MAX_ATTEMPTS, tools_given_to_the_model: "none" },
    budget, ...(problem ? { problem } : {}),
  });
}
