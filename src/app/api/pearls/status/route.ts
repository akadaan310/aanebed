import { json } from "../_shared";
import { aiAvailable, MODELS, spent } from "@/lib/pearls/ai";

export const dynamic = "force-dynamic";

/** GET — whether real AI help is on, which models, and this server instance's spending. No secrets. */
export async function GET() {
  const on = aiAvailable();
  const s = on ? await spent() : null;
  return json(200, { ai: on && !!s && s.remaining_usd > 0.05, models: { shape: MODELS.shape.model, quick: MODELS.quick.model, deep: MODELS.deep.model }, instance_budget: s });
}
