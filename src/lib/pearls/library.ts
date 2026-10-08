/**
 * My Pearls: what this browser has kept. A cache of links, honestly labelled:
 * kept here, in this browser. The link itself is the whole Pearl, so it can be
 * kept anywhere else too (notes, email, another device).
 */
import type { Kind } from "./model";

export const MINE = "pearls.mine.v1";
export interface Kept { id: string; code: string; title: string; kind: Kind; essence: string; from: string | null; hands: number; lastBy: string; at: string }

export function readMine(): Kept[] {
  try { const v = JSON.parse(localStorage.getItem(MINE) ?? "[]"); return Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string" && typeof x.code === "string") : []; } catch { return []; }
}
/** Returns false when the browser won't store it (private mode, full). */
export function keep(k: Kept): boolean {
  try { localStorage.setItem(MINE, JSON.stringify([k, ...readMine().filter((x) => x.id !== k.id)].slice(0, 300))); return true; } catch { return false; }
}
export function forget(id: string) { try { localStorage.setItem(MINE, JSON.stringify(readMine().filter((x) => x.id !== id))); } catch { /* nothing kept */ } }
export const isKept = (id: string) => readMine().some((x) => x.id === id);
