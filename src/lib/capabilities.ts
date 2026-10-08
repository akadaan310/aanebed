/**
 * The capability registry: every operation an AI (or anyone) can invoke on
 * this site by URL. Only operations that run here and are tested appear.
 * All are pure GET requests: no state changes, no network access, no
 * evaluation of submitted code.
 */
import { ORIGIN } from "@/config/origin";
import { LIMITS as X_LIMITS, REGISTRY as X_REGISTRY } from "./address";
import { LIMITS as E_LIMITS } from "./experience";

export const TEXT_LIMIT = 10_000;

export interface Capability {
  id: string;
  version: string;
  purpose: string;
  method: "GET";
  url: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  mode: "pure";
  side_effects: "none";
  auth: "none";
  limits: Record<string, unknown>;
  errors: Record<string, string>;
  engine: string;
  example: string;
}

export const CAPABILITIES: Capability[] = [
  {
    id: "pearl.check", version: "1", purpose: "Validate a Pearl link; return its parsed document, content id, digest, canonical and portable links, and the parameters that actually arrived.",
    method: "GET", url: `${ORIGIN}/e.json?{the Pearl's query}`,
    input: { query: "the Pearl grammar (see /compose)" },
    output: { valid: "boolean", pearl: "{ id, digest, type, blocks }", links: "{ view, portable }", received: "[[key, value]]", hints: "string[]" },
    mode: "pure", side_effects: "none", auth: "none", limits: { url_chars: E_LIMITS.urlChars, blocks: E_LIMITS.blocks },
    errors: { "422": "invalid or empty Pearl; errors[] says why" }, engine: "javascript (this site)",
    example: `${ORIGIN}/e.json?type=notes&title=Hello&b1=p:First+block`,
  },
  {
    id: "pearl.decode", version: "1", purpose: "Turn a portable Pearl link (/p/{id}.{payload}) back into its readable /e link and document, verifying the payload against its id.",
    method: "GET", url: `${ORIGIN}/api/v1/pearl/decode?u={a /p/ link or its last path segment}`,
    input: { u: "string" }, output: { id: "string", verified: "boolean", view: "string", document: "object" },
    mode: "pure", side_effects: "none", auth: "none", limits: { token_chars: 12_000, inflated_bytes: 65_536 },
    errors: { "400": "not a portable Pearl link", "422": "payload unreadable, invalid, or does not hash to its id" }, engine: "javascript (this site)",
    example: `${ORIGIN}/api/v1/pearl/decode?u=/p/p_…`,
  },
  {
    id: "hash.sha256", version: "1", purpose: "SHA-256 of a UTF-8 string, with the 80-bit Crockford-base32 short form Pearls use for ids. Useful because language models cannot compute hashes reliably.",
    method: "GET", url: `${ORIGIN}/api/v1/hash?text={text}`,
    input: { text: `string, at most ${TEXT_LIMIT} characters` }, output: { sha256: "hex", short: "16 base32 chars", bytes: "number" },
    mode: "pure", side_effects: "none", auth: "none", limits: { text_chars: TEXT_LIMIT },
    errors: { "400": "missing text", "413": "text too long" }, engine: "javascript (this site)",
    example: `${ORIGIN}/api/v1/hash?text=hello`,
  },
  {
    id: "text.transform", version: "1", purpose: "Deterministic text operations: normalize (NFC, collapse whitespace, strip control and bidi-override characters), slug (URL-safe slug), count (characters, code points, words, lines).",
    method: "GET", url: `${ORIGIN}/api/v1/text/{normalize|slug|count}?text={text}`,
    input: { op: ["normalize", "slug", "count"], text: `string, at most ${TEXT_LIMIT} characters` }, output: { op: "string", result: "string | object" },
    mode: "pure", side_effects: "none", auth: "none", limits: { text_chars: TEXT_LIMIT },
    errors: { "400": "missing text", "404": "unknown operation", "413": "text too long" }, engine: "javascript (this site)",
    example: `${ORIGIN}/api/v1/text/slug?text=Teta's+lentil+soup`,
  },
  {
    id: "compute.eca", version: "1", purpose: "Elementary cellular automata as computational addresses: a map, a state, one transition, a perturbation, a trace or an orbit. Results match substrateIO's reference resolver hash-for-hash.",
    method: "GET", url: `${ORIGIN}/x/map/eca/{rule}/{n}/state/{x}[/next|/flip/{bit}|/trace/{steps}|/orbit]`,
    input: { operations: X_REGISTRY.map((o) => o.id) }, output: { value: "object", identity: "{ value_sha256 }", derivation: "array" },
    mode: "pure", side_effects: "none", auth: "none", limits: X_LIMITS,
    errors: { "400": "malformed address", "404": "unknown operation", "422": "out of range", "429": "rate limited" }, engine: "javascript (this site); parity-tested against substrateIO (Python)",
    example: `${ORIGIN}/x/map/eca/90/8/state/5/next`,
  },
];

/** Compute engines behind capabilities. Only "javascript" exists; others are an adapter boundary, not a service. */
export const ENGINES = [
  { id: "javascript", status: "active", runs: ["pearl.check", "pearl.decode", "hash.sha256", "text.transform", "compute.eca"] },
  { id: "julia", status: "not available", note: "No Julia runtime is deployed. A future engine would implement the ComputeEngine interface (src/lib/capabilities.ts) behind a named, bounded capability; nothing is substituted for it." },
];

/** The adapter boundary for future engines. */
export interface ComputeEngine {
  id: string;
  run(capability: string, input: Record<string, unknown>, limits: { ms: number; bytes: number }): Promise<{ output: unknown; provenance: { engine: string; version: string; deterministic: boolean } }>;
}

export function registry() {
  return {
    format: "pearl-capabilities",
    version: 1,
    note: "Every operation listed here runs on this site and is covered by tests. All are pure GETs: no side effects, no authentication, no network access, no evaluation of submitted code. Operations not listed do not exist.",
    capabilities: CAPABILITIES,
    engines: ENGINES,
    requires_user_action: [
      { action: "Keep a Pearl", where: "the person's browser (My Pearls)", note: "No server write exists. Keeping is the person's own click, stored locally." },
    ],
    requires_backend: [
      { feature: "shared short links, accounts, cross-device library", status: "not available: no durable store is connected to this deployment" },
    ],
  };
}

// ------------------------------------------------------------ text operations

export function normalizeText(t: string): string {
  // eslint-disable-next-line no-control-regex
  return t.normalize("NFC").replace(/[\u0000-\u0008\u000b-\u001f\u007f‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim();
}
export function slugify(t: string): string {
  return normalizeText(t).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
export function countText(t: string) {
  return { characters: t.length, code_points: [...t].length, words: (t.trim().match(/\S+/g) ?? []).length, lines: t === "" ? 0 : t.split(/\r?\n/).length };
}
