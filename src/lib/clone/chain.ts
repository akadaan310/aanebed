/** The append-only event chain: event_hash = sha256(previous_hash + canonical(event body)). */
import { canonical, sha256, type Json } from "../canonical";

export type EventType = "CREATED" | "PROTOCOL_READ" | "RESPONSE_RECEIVED" | "RESPONSE_REJECTED" | "VERIFIED" | "CONTINUED" | "FORKED";
export interface EventBody { sequence: number; type: EventType; at: string; source: string; payload: Json }
export interface CloneEvent extends EventBody { previous_hash: string; hash: string }

export const GENESIS = "0".repeat(64);
export const eventHash = (prev: string, body: EventBody) => sha256(prev + canonical(body as unknown as Json));

export function seal(prev: CloneEvent | null, body: EventBody): CloneEvent {
  const previous_hash = prev ? prev.hash : GENESIS;
  return { ...body, previous_hash, hash: eventHash(previous_hash, body) };
}

/** Recompute the chain. Returns the first broken sequence, or null when intact. */
export function verifyChain(events: CloneEvent[]): { ok: boolean; broken: number | null } {
  let prev = GENESIS;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const { previous_hash, hash, ...body } = e;
    if (e.sequence !== i + 1 || previous_hash !== prev || hash !== eventHash(prev, body)) return { ok: false, broken: e.sequence };
    prev = hash;
  }
  return { ok: true, broken: null };
}
