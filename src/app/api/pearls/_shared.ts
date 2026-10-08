import { clientIp } from "@/lib/ratelimit";
import { TRUSTED_ORIGINS } from "@/config/origin";
import { AiError, anthropicCaller } from "@/lib/pearls/ai";

const HEAD = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: HEAD });

/** Browser writes must come from this site; scripts without an Origin header are allowed (rate limits and the budget still apply). */
export const sameSite = (req: Request) => { const o = req.headers.get("origin"); return !o || TRUSTED_ORIGINS.includes(o) || o === new URL(req.url).origin; };
export const ip = clientIp;
export const caller = () => anthropicCaller(process.env.ANTHROPIC_API_KEY!);

export function fail(e: unknown) {
  if (e instanceof AiError) return json(e.code === "busy" ? 429 : e.code === "budget" ? 402 : e.code === "unavailable" ? 503 : 502, { error: e.code, message: e.message });
  console.log(JSON.stringify({ evt: "pearls.error", message: (e as Error).message?.slice(0, 160) }));
  return json(500, { error: "internal", message: "Something went wrong on our side. Your work is safe on this page; try again." });
}

export const log = (evt: string, data: Record<string, unknown>) => console.log(JSON.stringify({ evt, at: new Date().toISOString(), ...data }));
