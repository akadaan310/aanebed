import { machine, unavailable } from "@/lib/clone/server";
import { instructions } from "@/lib/clone/protocol";
import { CloneError } from "@/lib/clone/machine";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";

/** The protocol in plain text, for an AI. Reading it is recorded once (PROTOCOL_READ). */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  try {
    const s = await m.state(token);
    if (s.status === "WAITING") await m.protocolRead(token, "read protocol.txt");
    const parent = s.parent ? { token: s.parent, summary: "read it before continuing" } : undefined;
    return new Response(instructions(ORIGIN, token, { parent }) + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  } catch (e) {
    return new Response(e instanceof CloneError ? `${e.message}\n` : "unavailable\n", { status: e instanceof CloneError ? e.status : 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
