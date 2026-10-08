import { machine, jsonRes, errorRes, unavailable, log, reqId, sameOriginOrNone, limited, publicState } from "@/lib/clone/server";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ token: string }> };

/** POST {kind: "continuation" | "fork"} — a new clone address descending from this living clone. The parent is not changed except for a CONTINUED/FORKED event. */
export async function POST(req: Request, ctx: Ctx) {
  const id = reqId();
  if (!sameOriginOrNone(req)) return jsonRes(403, { error: "origin", message: "Cross-site requests are not accepted." });
  const l = limited(req, "clone-create", 20); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  let kind: "continuation" | "fork" = "continuation";
  try { const b = await req.json(); if (b?.kind === "fork") kind = "fork"; } catch { /* default */ }
  try {
    const c = await m.create({ parent: token, kind });
    log("clone.child", { request_id: id, parent: token.slice(0, 7), child: c.token.slice(0, 7), kind });
    return jsonRes(201, { token: c.token, owner_key: c.ownerKey, address: `${ORIGIN}/clone/${c.token}`, state: publicState(c.state) });
  } catch (e) { return errorRes(e, id); }
}
