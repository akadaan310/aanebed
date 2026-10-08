import { machine, jsonRes, errorRes, unavailable, log, reqId, limited } from "@/lib/clone/server";
import { fromQuery, LIMITS } from "@/lib/clone/protocol";
import { CloneError } from "@/lib/clone/machine";

export const dynamic = "force-dynamic";

/**
 * GET /clone/{token}/r?v=1&confirm=…&… — the return path for AIs whose tools can
 * only open URLs. Writes are idempotent by content (a replay changes nothing).
 * Answers in plain text for the AI, or JSON when asked.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const id = reqId(); const t0 = Date.now();
  const l = limited(req, "clone-submit", 60); if (l) return l;
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  const url = new URL(req.url);
  if (req.url.length > LIMITS.getUrlChars) return jsonRes(414, { error: "too_long", message: "The URL is too long. Summarise the conversation into context, or POST JSON." });
  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");
  const reply = (status: number, lines: string[], body: unknown) => wantsJson ? jsonRes(status, body) : new Response(lines.join("\n") + "\n", { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  try {
    const r = await m.submit(token, fromQuery(url.searchParams), "direct-get");
    log("clone.submit", { request_id: id, token: token.slice(0, 7), outcome: r.outcome, channel: "direct-get", ms: Date.now() - t0 });
    if (r.outcome === "incomplete") return reply(422, ["INCOMPLETE — nothing was cloned yet.", "Missing:", ...(r.missing ?? []).map((x) => `  - ${x}`), ...(r.problems ?? []).map((x) => `  ! ${x}`), "", `Fix it and open the URL again. Instructions: ${url.origin}/clone/${token}/protocol.txt`], { outcome: r.outcome, missing: r.missing, problems: r.problems });
    return reply(r.status, [r.outcome === "duplicate" ? "ALREADY VERIFIED — this exact clone was received before; nothing changed." : "VERIFIED — the clone was received and verified.", `Pearl: ${r.state.clone?.pearl_id} · events: ${r.state.sequence} · chain head ${r.state.head?.slice(0, 16)}`, "", "Tell the person: \"Bring this back to Pearls.\"", `${url.origin}/clone/${token}`], { outcome: r.outcome, pearl_id: r.state.clone?.pearl_id, address: `${url.origin}/clone/${token}` });
  } catch (e) {
    if (e instanceof CloneError) return reply(e.status, [`NOT CLONED — ${e.message}`], { error: e.code, message: e.message });
    return errorRes(e, id);
  }
}
