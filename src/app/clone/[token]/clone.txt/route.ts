import { machine, unavailable } from "@/lib/clone/server";
import { cloneText, CloneError } from "@/lib/clone/machine";

export const dynamic = "force-dynamic";

/** The clone as plain text: what the next AI reads to continue. Only what the protocol received, with its classification. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  try { return new Response(cloneText(await m.state(token)), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }); }
  catch (e) { return new Response(e instanceof CloneError ? `${e.message}\n` : "unavailable\n", { status: e instanceof CloneError ? e.status : 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
}
