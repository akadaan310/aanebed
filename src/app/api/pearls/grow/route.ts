import { json, sameSite, ip, caller, fail, log } from "../_shared";
import { aiAvailable, admit, grow } from "@/lib/pearls/ai";
import { encode, decode, pathOf } from "@/lib/pearls/codec";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST {code, direction, depth: "quick" | "deep"} → the Pearl's next version, grown by Claude Haiku 5.5 or Claude Sonnet 5.5 from the actual Pearl. */
export async function POST(req: Request) {
  if (!sameSite(req)) return json(403, { error: "origin", message: "Cross-site requests are not accepted." });
  if (!aiAvailable()) return json(503, { error: "unavailable", message: "AI isn't switched on here right now. You can still edit this Pearl yourself, or give it to your own AI." });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* below */ }
  const parent = typeof b.code === "string" ? await decode(b.code) : null;
  if (!parent) return json(400, { error: "no_pearl", message: "That Pearl couldn't be read." });
  const use = b.depth === "deep" ? "deep" : "quick";
  const t0 = Date.now();
  try {
    admit(ip(req), use);
    const r = await grow(parent, typeof b.direction === "string" ? b.direction : "", use, `${ORIGIN}${pathOf(b.code as string)}`, caller());
    log("pearls.grown", { model: r.model, depth: use, ms: Date.now() - t0, micro_usd: Math.round(r.cost * 1e6) });
    return json(200, { pearl: r.pearl, code: await encode(r.pearl), model: r.model });
  } catch (e) { return fail(e); }
}
