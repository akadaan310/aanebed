import { parseExperience, type Parsed } from "./experience";
import { NODES } from "@/content/research";

export const RESEARCH_IDS = new Set(NODES.map((n) => n.id));
type SP = Record<string, string | string[] | undefined>;

/** Rebuild the query string in order, so the page can link to its own JSON and remix views. */
export function queryOf(sp: SP): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, x);
  return q.toString();
}

export function parseRequest(sp: SP): { parsed: Parsed; query: string } {
  const query = queryOf(sp);
  return { parsed: parseExperience(sp, RESEARCH_IDS, "https://abedkadaan.com/e?".length + query.length), query };
}
