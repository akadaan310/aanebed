import { machine, jsonRes, errorRes, unavailable, log, reqId, sameOriginOrNone, limited, publicState } from "@/lib/clone/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ token: string }> };

/** GET — the authoritative state (?at=sequence for the state as of that event). */
export async function GET(req: Request, ctx: Ctx) {
  const id = reqId();
  const l = limited(req, "clone-read", 240); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  const at = Number(new URL(req.url).searchParams.get("at") ?? "") || undefined;
  try { return jsonRes(200, publicState(await m.state(token, at))); } catch (e) { return errorRes(e, id); }
}

/** DELETE — the owner deletes the clone: its material is removed, a tombstone remains. Body: {"owner_key": "k_…"}. */
export async function DELETE(req: Request, ctx: Ctx) {
  const id = reqId();
  if (!sameOriginOrNone(req)) return jsonRes(403, { error: "origin", message: "Cross-site requests are not accepted." });
  const l = limited(req, "clone-delete", 30); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  let body: { owner_key?: string } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  try { const n = await m.remove(token, body.owner_key ?? ""); log("clone.deleted", { request_id: id, token: token.slice(0, 7), objects: n }); return jsonRes(200, { deleted: true, objects_removed: n }); } catch (e) { return errorRes(e, id); }
}
