/**
 * Server-only. When a model on this site contributes to a Pearl, the server seals
 * that contribution: an HMAC over the whole Pearl as it stood (without seals).
 * Anyone can edit a link; only this server can make a seal match. So the page can
 * say "recorded by Pearls" for real contributions and "as it says" for claims.
 *
 * Key: PEARLS_SEAL_KEY, or one derived from ANTHROPIC_API_KEY (the derived key
 * reveals nothing about it). If the key changes, older seals read as unverifiable.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { canonical } from "../canonical";
import { unsealed, type Pearl } from "./model";

function key(env = process.env): Buffer | null {
  if (env.PEARLS_SEAL_KEY) return Buffer.from(env.PEARLS_SEAL_KEY);
  if (env.ANTHROPIC_API_KEY) return createHmac("sha256", env.ANTHROPIC_API_KEY).update("pearls-seal-v1").digest();
  return null;
}

const mac = (k: Buffer, p: Pearl) => createHmac("sha256", k).update(canonical(unsealed(p))).digest("hex");

/** Seal the last hand (which must be a model's). */
export function seal(p: Pearl): Pearl {
  const k = key();
  if (!k) return p;
  const hands = [...p.hands];
  hands[hands.length - 1] = { ...hands[hands.length - 1], sig: mac(k, p) };
  return { ...p, hands };
}

export type SealState = "verified" | "unverified" | "none";
/** "verified": the newest hand is a model contribution this server recorded, on exactly this content. */
export function verify(p: Pearl): SealState {
  const last = p.hands.at(-1);
  if (!last || last.by !== "model") return "none";
  const k = key();
  if (!k || !last.sig) return "unverified";
  const want = Buffer.from(mac(k, p), "hex"), got = Buffer.from(last.sig, "hex");
  return want.length === got.length && timingSafeEqual(want, got) ? "verified" : "unverified";
}
