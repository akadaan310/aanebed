import { machine, unavailable } from "@/lib/clone/server";
import { cloneText, CloneError } from "@/lib/clone/machine";
import { visitPrompt } from "@/lib/clone/visitor";
import { sha256 } from "@/lib/canonical";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
const TEXT = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/** Exactly what the invited AI received, rebuilt from the record and checked against the hash written before the call. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  try {
    const s = await m.state(token);
    const inv = s.events.find((e) => e.type === "INVITED");
    if (!inv) return new Response("No AI was invited into this Pearl by this server.\n", { status: 404, headers: TEXT });
    const p = inv.payload as Record<string, string>;
    const parent = p.read_parent ? await m.state(p.read_parent).catch(() => null) : null;
    const prompt = visitPrompt({ origin: ORIGIN, token, ask: p.ask, parent: p.read_parent ? { token: p.read_parent, text: parent ? cloneText(parent) : "" } : null });
    const match = sha256(prompt) === p.prompt_sha256;
    return new Response(`# ${p.label} (${p.model}) received this message, event #${inv.sequence}, ${inv.at}.\n# sha256 recorded before the call: ${p.prompt_sha256}\n# sha256 of the text below:        ${sha256(prompt)} — ${match ? "MATCH" : "DIFFERENT (the previous Pearl was deleted or the frame changed)"}\n\n${prompt}\n`, { headers: TEXT });
  } catch (e) { return new Response(e instanceof CloneError ? `${e.message}\n` : "unavailable\n", { status: e instanceof CloneError ? e.status : 500, headers: TEXT }); }
}
