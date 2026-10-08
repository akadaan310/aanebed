import { json, sameSite, ip, caller, fail, log } from "../_shared";
import { aiAvailable, admit, shape } from "@/lib/pearls/ai";
import { encode } from "@/lib/pearls/codec";
import { LIMITS } from "@/lib/pearls/model";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST {text} → a Pearl shaped by Claude Haiku 5.5, with its link code. The person's words are never lost: on failure the client keeps them. */
export async function POST(req: Request) {
  if (!sameSite(req)) return json(403, { error: "origin", message: "Cross-site requests are not accepted." });
  if (!aiAvailable()) return json(503, { error: "unavailable", message: "AI isn't switched on here right now. You can still make a Pearl from your own words." });
  let text = "";
  try { const b = await req.json(); text = typeof b?.text === "string" ? b.text : ""; } catch { /* below */ }
  if (!text.trim()) return json(400, { error: "empty", message: "Write something first." });
  if (text.length > LIMITS.origin) return json(413, { error: "too_long", message: `Keep it under ${LIMITS.origin} characters, or make it from your own words.` });
  const t0 = Date.now();
  try {
    admit(ip(req), "shape");
    const r = await shape(text, caller());
    log("pearls.shaped", { model: r.model, ms: Date.now() - t0, micro_usd: Math.round(r.cost * 1e6) });
    return json(200, { pearl: r.pearl, code: await encode(r.pearl), model: r.model });
  } catch (e) { return fail(e); }
}
