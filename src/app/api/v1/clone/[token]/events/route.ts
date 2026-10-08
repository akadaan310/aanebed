import { machine, jsonRes, errorRes, unavailable, log, reqId, sameOriginOrNone, limited, publicState } from "@/lib/clone/server";
import { LIMITS } from "@/lib/clone/protocol";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ token: string }> };

/**
 * POST — a receiving AI (or the person, relaying the AI's reply) submits the clone.
 * Body: the pearl-clone/1 JSON. Header X-Pearl-Channel: relayed when a person pastes it from a browser.
 */
export async function POST(req: Request, ctx: Ctx) {
  const id = reqId(); const t0 = Date.now();
  const relayed = req.headers.get("x-pearl-channel") === "relayed";
  if (relayed && !sameOriginOrNone(req)) return jsonRes(403, { error: "origin", message: "Cross-site requests are not accepted." });
  const l = limited(req, "clone-submit", 60); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  const text = await req.text();
  if (text.length > LIMITS.payloadBytes * 2) return jsonRes(413, { error: "too_large", message: `At most ${LIMITS.payloadBytes} bytes.` });
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return jsonRes(400, { error: "not_json", message: "The body must be pearl-clone/1 JSON." }); }
  try {
    const r = await m.submit(token, raw, relayed ? "relayed-by-person" : "direct-post");
    log("clone.submit", { request_id: id, token: token.slice(0, 7), outcome: r.outcome, channel: relayed ? "relayed" : "direct-post", ms: Date.now() - t0, missing: r.missing?.length ?? 0 });
    return jsonRes(r.status, { outcome: r.outcome, missing: r.missing ?? [], problems: r.problems ?? [], say_to_person: r.outcome === "incomplete" ? "The response arrived, but the clone is incomplete." : "Bring this back to Pearls.", state: publicState(r.state) });
  } catch (e) { log("clone.submit_failed", { request_id: id, token: token.slice(0, 7), code: (e as { code?: string }).code }); return errorRes(e, id); }
}
