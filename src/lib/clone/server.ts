/** Shared server helpers for the clone API: the machine, errors, origin checks, structured logs. */
import { CloneMachine, CloneError, type CloneState } from "./machine";
import { getKv } from "./kv";
import { take, clientIp } from "../ratelimit";
import { TRUSTED_ORIGINS, ORIGIN } from "../../config/origin";

export async function machine(): Promise<CloneMachine | null> {
  const kv = await getKv();
  return kv ? new CloneMachine(kv) : null;
}

const HEAD = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Access-Control-Allow-Origin": "*" };
export const jsonRes = (status: number, body: unknown, extra: Record<string, string> = {}) => new Response(JSON.stringify(body, null, 1), { status, headers: { ...HEAD, ...extra } });

export function errorRes(e: unknown, reqId: string): Response {
  if (e instanceof CloneError) return jsonRes(e.status, { error: e.code, message: e.message, details: e.details, request_id: reqId });
  log("clone.error", { request_id: reqId, message: (e as Error).message?.slice(0, 200) });
  return jsonRes(500, { error: "internal", message: "That Pearl couldn't continue. Try again in a moment.", request_id: reqId });
}

export const unavailable = () => jsonRes(503, { error: "no_store", message: "Clone storage is not configured on this deployment." });

/** Structured logs: event names, token prefixes and timings only — never payload contents. */
export function log(evt: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ evt, at: new Date().toISOString(), ...data }));
}
export const reqId = () => Math.random().toString(36).slice(2, 10);

/** Browser-initiated writes must come from this site (CSRF). AIs posting with no Origin header are allowed: the address is the capability. */
export function sameOriginOrNone(req: Request): boolean {
  const o = req.headers.get("origin");
  return !o || TRUSTED_ORIGINS.includes(o) || o === new URL(req.url).origin;
}

export function limited(req: Request, ns: string, cap: number): Response | null {
  return take(clientIp(req), Date.now(), ns, cap).ok ? null : jsonRes(429, { error: "rate_limited", message: "Too many requests from here. Try again shortly." });
}

/** The public shape of a state: everything the holder of the address may see. */
export function publicState(s: CloneState, origin = ORIGIN) {
  return {
    protocol: "pearl-clone/1", token: s.token, status: s.status, kind: s.kind, parent: s.parent, created_at: s.created_at, expires_at: s.expires_at,
    sequence: s.sequence, head: s.head, opened: s.opened, rejections: s.rejections, clone: s.clone, children: s.children,
    events: s.events.map((e) => ({ sequence: e.sequence, type: e.type, at: e.at, source: e.source, hash: e.hash, previous_hash: e.previous_hash, ...(e.type === "RESPONSE_RECEIVED" ? { payload: { channel: (e.payload as Record<string, unknown>).channel, payload_hash: (e.payload as Record<string, unknown>).payload_hash } } : { payload: e.payload }) })),
    links: { page: `${origin}/clone/${s.token}`, protocol: `${origin}/clone/${s.token}/protocol.txt`, clone_text: `${origin}/clone/${s.token}/clone.txt`, events: `${origin}/api/v1/clone/${s.token}/events`, stream: `${origin}/api/v1/clone/${s.token}/stream`, verify: `${origin}/api/v1/clone/${s.token}/verify` },
  };
}
