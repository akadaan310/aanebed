import { machine, jsonRes, errorRes, unavailable, log, reqId, sameOriginOrNone, limited, publicState } from "@/lib/clone/server";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";

/** POST /api/v1/clone — begin a clone. Returns the address and the owner key (shown once; it deletes the clone). */
export async function POST(req: Request) {
  const id = reqId(); const t0 = Date.now();
  if (!sameOriginOrNone(req)) return jsonRes(403, { error: "origin", message: "Cross-site requests are not accepted." });
  const l = limited(req, "clone-create", 20); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  try {
    const { token, ownerKey, state } = await m.create();
    log("clone.created", { request_id: id, token: token.slice(0, 7), ms: Date.now() - t0 });
    return jsonRes(201, { token, owner_key: ownerKey, address: `${ORIGIN}/clone/${token}`, state: publicState(state), note: "Keep owner_key private: it is the only way to delete this clone." });
  } catch (e) { return errorRes(e, id); }
}
