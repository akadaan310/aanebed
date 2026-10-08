import { after } from "next/server";
import { machine, jsonRes, errorRes, unavailable, log, reqId, sameOriginOrNone, limited } from "@/lib/clone/server";
import { getKv } from "@/lib/clone/kv";
import { Ledger } from "@/lib/clone/budget";
import { beginVisit, runVisit, anthropicCaller, visitorsAvailable, type VisitorKey } from "@/lib/clone/visitor";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
type Ctx = { params: Promise<{ token: string }> };

/**
 * POST {owner_key, visitor: "haiku" | "sonnet", ask?} — invite a real Claude into this Pearl.
 * Answers 202 at once; the visit continues on the server and every step arrives on the stream.
 */
export async function POST(req: Request, ctx: Ctx) {
  const id = reqId();
  if (!sameOriginOrNone(req)) return jsonRes(403, { error: "origin", message: "Cross-site requests are not accepted." });
  const l = limited(req, "clone-invite", 6); if (l) return l;
  if (!visitorsAvailable()) return jsonRes(503, { error: "no_visitor", message: "No AI is connected to invite on this deployment. You can still give the address to any AI yourself." });
  const m = await machine(); const kv = await getKv(); if (!m || !kv) return unavailable();
  const { token } = await ctx.params;
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* validated below */ }
  const ledger = new Ledger(kv);
  try {
    const { prompt, v } = await beginVisit(m, { token, ownerKey: b.owner_key, visitor: b.visitor as VisitorKey, ask: b.ask, origin: ORIGIN, ledger });
    log("clone.invited", { request_id: id, token: token.slice(0, 7), model: v.model });
    const caller = anthropicCaller(process.env.ANTHROPIC_API_KEY!);
    after(async () => {
      const t0 = Date.now();
      try { await runVisit(m, { token, prompt, v, ledger, caller }); log("clone.visit_done", { request_id: id, token: token.slice(0, 7), model: v.model, ms: Date.now() - t0 }); }
      catch (e) { log("clone.visit_error", { request_id: id, token: token.slice(0, 7), message: (e as Error).message?.slice(0, 160) }); }
    });
    return jsonRes(202, { outcome: "invited", model: v.model, label: v.label, say_to_person: `${v.label} is on its way in.` });
  } catch (e) { return errorRes(e, id); }
}
