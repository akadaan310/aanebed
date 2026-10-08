import { machine, unavailable, publicState } from "@/lib/clone/server";
import { CloneError } from "@/lib/clone/machine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET — Server-Sent Events. Each new event in the chain is pushed as it is
 * written ("event: state", the full public state). The stream ends after ~50 s;
 * EventSource reconnects with Last-Event-ID and resumes from that sequence.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const m = await machine(); if (!m) return unavailable();
  const { token } = await ctx.params;
  const last = Number(req.headers.get("last-event-id") ?? new URL(req.url).searchParams.get("after") ?? "0") || 0;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      let seen = last, closed = false;
      const send = (s: string) => { if (!closed) c.enqueue(enc.encode(s)); };
      req.signal.addEventListener("abort", () => { closed = true; });
      send("retry: 1500\n\n");
      const until = Date.now() + 50_000;
      while (!closed && Date.now() < until) {
        try {
          const s = await m.state(token);
          if (s.sequence > seen || seen === 0) { seen = s.sequence; send(`id: ${s.sequence}\nevent: state\ndata: ${JSON.stringify(publicState(s))}\n\n`); }
          if (s.status === "DELETED") break;
        } catch (e) {
          send(`event: problem\ndata: ${JSON.stringify({ error: e instanceof CloneError ? e.code : "internal" })}\n\n`);
          if (e instanceof CloneError && e.status === 404) break;
        }
        send(": keep-alive\n\n");
        await new Promise((r) => setTimeout(r, 1200));
      }
      closed = true; c.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
