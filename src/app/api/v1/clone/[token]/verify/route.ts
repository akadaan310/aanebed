import { machine, jsonRes, errorRes, unavailable, reqId } from "@/lib/clone/server";

export const dynamic = "force-dynamic";

/** GET — recompute the event chain: event_hash = sha256(previous_hash + canonical(event)). */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const id = reqId();
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  try { const s = await m.state(token); const v = await m.verify(token); return jsonRes(200, { token, events: s.events.length, head: s.head, chain_intact: v.ok, broken_at: v.broken, rule: "event_hash = sha256(previous_hash + canonical(event body)); genesis previous_hash = 64 zeros" }); } catch (e) { return errorRes(e, id); }
}
