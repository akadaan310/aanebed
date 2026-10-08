/**
 * Composed experiences: a page whose entire content lives in its URL.
 *
 * An AI that has read this site can write a URL such as
 *
 *   https://abedkadaan.com/e?title=Your+tour&by=Claude&for=a+curious+reader
 *     &b=h:What+PURL+is&b=p:A+URL+that+names+a+resource+and+its+operations.
 *     &b=flow:Address>Program>State>Transition>Result
 *     &b=x:/map/eca/30/16/state/256/trace/24
 *
 * and give it to the person it is talking to. Opening it renders the page.
 * Nothing is stored: the URL is the experience. Content is untrusted and is
 * rendered as plain text; links must be https; sizes are bounded.
 */

import { hashJson, type Json } from "./canonical";

export const GRAMMAR_VERSION = "experience/1";

export const LIMITS = { urlChars: 8000, blocks: 40, blockChars: 1500, titleChars: 140, listItems: 24, tableRows: 16, tableCols: 6 } as const;

export type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "facts"; items: { k: string; v: string }[] }
  | { type: "table"; rows: string[][] }
  | { type: "flow"; items: string[] }
  | { type: "code"; text: string }
  | { type: "x"; address: string }
  | { type: "research"; id: string }
  | { type: "link"; href: string; label: string; host: string }
  | { type: "c"; kind: ContinuityKind; key?: string; text: string };

/** Continuity entries: what a session writes down so that other sessions can continue the relationship. */
export type ContinuityKind = "ai" | "human" | "nick" | "nuance" | "lex" | "mem" | "thread" | "close" | "said" | "decision";

export const CONTINUITY_TYPES: { kind: ContinuityKind; syntax: string; means: string; example: string }[] = [
  { kind: "ai", syntax: "ai:Name", means: "what the AI is called in this relationship", example: "ai:Sunny" },
  { kind: "human", syntax: "human:Name", means: "what to call the person", example: "human:Sam" },
  { kind: "nick", syntax: "nick:Name=who or what it means", means: "a nickname and what it refers to", example: "nick:Captain Commit=what Sunny calls Sam when Sam pushes at 2 a.m." },
  { kind: "nuance", syntax: "nuance:text", means: "tone, habits, running jokes, misspellings that mean something", example: "nuance:Sam writes 'teh' on purpose when excited; never correct it." },
  { kind: "lex", syntax: "lex:term=meaning", means: "a word or phrase coined in this conversation", example: "lex:the drawer=the list of ideas we parked for later" },
  { kind: "mem", syntax: "mem:text", means: "something that happened or was shared", example: "mem:We named the cat project 'Purrl' on the first night." },
  { kind: "thread", syntax: "thread:text", means: "an open thread or next step", example: "thread:Finish the onboarding copy for the Purrl landing page" },
  { kind: "close", syntax: "close:text of the thread", means: "closes an open thread", example: "close:Finish the onboarding copy for the Purrl landing page" },
  { kind: "said", syntax: "said:text", means: "a summary of what this session talked about", example: "said:Sam asked for three taglines; we chose 'Addresses that remember'." },
  { kind: "decision", syntax: "decision:text", means: "something decided together", example: "decision:Ship on Friday, not Thursday." },
];

export interface Experience {
  grammar: typeof GRAMMAR_VERSION;
  title: string;
  by: string | null;
  for: string | null;
  /** a label the composing session chose for itself */
  session: string | null;
  blocks: Block[];
}

export interface Parsed {
  doc: Experience;
  id: string;
  warnings: string[];
  errors: string[];
}

/** The block types, documented once and used by the parser, /compose, the manifests and the tests. */
export const BLOCK_TYPES: { type: Block["type"]; syntax: string; renders: string; example: string }[] = [
  { type: "h", syntax: "h:Heading text", renders: "a section heading", example: "h:Why this matters to you" },
  { type: "p", syntax: "p:Paragraph text", renders: "a paragraph", example: "p:PURL treats a URL as the address of a resource and the operations on it." },
  { type: "note", syntax: "note:Text", renders: "a highlighted aside", example: "note:This part is a hypothesis, not a result." },
  { type: "quote", syntax: "quote:Text|Attribution", renders: "a pull quote", example: "quote:Continuity does not imply identity.|ACSP invariant" },
  { type: "list", syntax: "list:item|item|item", renders: "a bulleted list", example: "list:ACSP|PURL|substrateIO" },
  { type: "steps", syntax: "steps:first|second|third", renders: "a numbered sequence", example: "steps:Open the URL|Read the manifest|Run one address" },
  { type: "facts", syntax: "facts:Key=Value|Key=Value", renders: "a definition list", example: "facts:Protocol=ACSP/0.1|Harness=402 checks" },
  { type: "table", syntax: "table:H1;H2|a;b|c;d", renders: "a table (rows split by |, cells by ;; first row is the header)", example: "table:Project;Status|PURL;tested|SEURL;proposed" },
  { type: "flow", syntax: "flow:A>B>C", renders: "a transition chain", example: "flow:Question>Manifest>Experiment>Evidence" },
  { type: "code", syntax: "code:text", renders: "monospace text", example: "code:curl https://abedkadaan.com/research.json" },
  { type: "x", syntax: "x:/map/eca/{rule}/{n}/state/{x}/…", renders: "a live computation, resolved by this site and verified by hash", example: "x:/map/eca/30/16/state/256/trace/24" },
  { type: "research", syntax: "research:{node id}", renders: "a card for one research node, from this site's records", example: "research:continuity" },
  { type: "link", syntax: "link:https://…|Label", renders: "an outbound link (https only; the host is always shown)", example: "link:https://github.com/akadaan310/purl|PURL on GitHub" },
];

const ALIASES: Record<string, Block["type"]> = {
  h: "h", h1: "h", h2: "h", heading: "h", title: "h",
  p: "p", text: "p", para: "p", paragraph: "p",
  note: "note", aside: "note", callout: "note",
  quote: "quote", q: "quote",
  list: "list", ul: "list", bullets: "list",
  steps: "steps", ol: "steps", sequence: "steps",
  facts: "facts", kv: "facts", dl: "facts",
  table: "table",
  flow: "flow", chain: "flow",
  code: "code", pre: "code",
  x: "x", compute: "x", address: "x",
  research: "research", node: "research",
  link: "link", a: "link", url: "link",
};

const C_ALIASES: Record<string, ContinuityKind> = {
  ai: "ai", me: "ai", self: "ai", human: "human", user: "human", you: "human",
  nick: "nick", nickname: "nick", nuance: "nuance", quirk: "nuance", style: "nuance",
  lex: "lex", term: "lex", word: "lex", mem: "mem", memory: "mem",
  thread: "thread", todo: "thread", next: "thread", close: "close", done: "close",
  said: "said", turn: "said", summary: "said", decision: "decision", decided: "decision",
};

/** Control characters out, whitespace collapsed, bounded. */
function clean(s: string, max: number = LIMITS.blockChars): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, max);
}
const split = (s: string, sep: string | RegExp, max: number) => s.split(sep).map((x) => clean(x, 400)).filter(Boolean).slice(0, max);

/** Undo the encoding mistakes language models commonly make: double encoding, leftover %20s. */
function tolerant(v: string): string {
  let s = v;
  for (let i = 0; i < 2 && /%[0-9A-Fa-f]{2}/.test(s); i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  return s;
}

export function parseBlock(raw: string, warnings: string[], researchIds: Set<string>): Block | null {
  const s = tolerant(raw);
  const m = /^\s*([A-Za-z0-9]{1,10})\s*:\s?([\s\S]*)$/.exec(s);
  const ck = m ? C_ALIASES[m[1].toLowerCase()] : undefined;
  if (m && ck) {
    const body = clean(m[2]);
    if (!body) return null;
    if (ck === "nick" || ck === "lex") {
      const i = body.search(/[=:]/);
      return i > 0 ? { type: "c", kind: ck, key: clean(body.slice(0, i), 80), text: clean(body.slice(i + 1)) } : { type: "c", kind: ck, key: body.slice(0, 80), text: "" };
    }
    return { type: "c", kind: ck, text: ck === "ai" || ck === "human" ? body.slice(0, 80) : body };
  }
  const type = m ? ALIASES[m[1].toLowerCase()] : undefined;
  if (!m || !type) {
    const t = clean(s);
    if (!t) return null;
    warnings.push(`block without a known type ("${t.slice(0, 24)}…") rendered as a paragraph`);
    return { type: "p", text: t };
  }
  const body = m[2];
  switch (type) {
    case "h": case "p": case "note": case "code": {
      const text = type === "code" ? body.slice(0, LIMITS.blockChars).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "") : clean(body);
      return text ? { type, text } : null;
    }
    case "quote": {
      const [text, cite] = body.split("|");
      return { type, text: clean(text), cite: cite ? clean(cite, 120) : undefined };
    }
    case "list": case "steps": case "flow": {
      const items = split(body, type === "flow" ? /\s*(?:>|→|->)\s*/ : "|", LIMITS.listItems);
      return items.length ? { type, items } : null;
    }
    case "facts": {
      const items = split(body, "|", LIMITS.listItems).map((pair) => {
        const i = pair.search(/[=:]/);
        return i > 0 ? { k: clean(pair.slice(0, i), 80), v: clean(pair.slice(i + 1), 400) } : { k: pair, v: "" };
      });
      return items.length ? { type, items } : null;
    }
    case "table": {
      const rows = body.split("|").slice(0, LIMITS.tableRows).map((r) => r.split(";").slice(0, LIMITS.tableCols).map((c) => clean(c, 200)));
      return rows.length && rows[0].length ? { type, rows } : null;
    }
    case "x": {
      let a = body.trim();
      a = a.replace(/^https?:\/\/[^/]+/, "").replace(/^\/x(?=\/)/, "");
      if (!a.startsWith("/")) a = "/" + a;
      if (!/^\/[a-z0-9/]{1,200}$/.test(a)) { warnings.push(`computation address rejected: ${clean(body, 60)}`); return null; }
      return { type, address: a };
    }
    case "research": {
      const id = clean(body, 40).toLowerCase();
      if (!researchIds.has(id)) { warnings.push(`unknown research node "${id}"`); return null; }
      return { type, id };
    }
    case "link": {
      const [href, ...rest] = body.split("|");
      let u: URL;
      try { u = new URL(href.trim()); } catch { warnings.push(`link rejected (not a URL): ${clean(href, 60)}`); return null; }
      if (u.protocol !== "https:" || u.username || u.password) { warnings.push(`link rejected (https only, no credentials): ${u.protocol}//${u.host}`); return null; }
      return { type, href: u.toString(), label: clean(rest.join("|"), 120) || u.host, host: u.host };
    }
  }
  return null;
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function all(p: Params, key: string): string[] {
  if (p instanceof URLSearchParams) return p.getAll(key);
  const v = p[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

/** Parse a composed experience from query parameters. Never throws. */
export function parseExperience(p: Params, researchIds: Set<string>, rawLength = 0): Parsed {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (rawLength > LIMITS.urlChars) errors.push(`URL is ${rawLength} characters; the limit is ${LIMITS.urlChars}`);

  // Blocks from repeated b= (the documented form), then from s= (one block per line), in that order.
  const rawBlocks = [...all(p, "b"), ...all(p, "block"), ...all(p, "s").flatMap((s) => tolerant(s).split(/\r?\n/))];
  if (rawBlocks.length > LIMITS.blocks) warnings.push(`${rawBlocks.length} blocks; only the first ${LIMITS.blocks} are rendered`);
  const blocks = rawBlocks.slice(0, LIMITS.blocks).map((b) => parseBlock(b, warnings, researchIds)).filter((b): b is Block => b !== null);

  const title = clean(tolerant(all(p, "title")[0] ?? all(p, "t")[0] ?? ""), LIMITS.titleChars);
  const by = clean(tolerant(all(p, "by")[0] ?? ""), 60) || null;
  const forWhom = clean(tolerant(all(p, "for")[0] ?? ""), 140) || null;
  const session = clean(tolerant(all(p, "session")[0] ?? ""), 60).replace(/[^\p{L}\p{N} ._-]/gu, "") || null;
  if (!title && !blocks.length) errors.push("empty: no title and no blocks. See https://abedkadaan.com/compose for the grammar.");
  if (!by) warnings.push("no by= parameter: the composer is not named");

  const doc: Experience = { grammar: GRAMMAR_VERSION, title: title || "Untitled experience", by, for: forWhom, session, blocks };
  return { doc, id: hashJson(doc as unknown as Json), warnings, errors };
}

/** Build the canonical URL for a document (used by /compose and the tests). */
export function experienceUrl(origin: string, doc: { title?: string | null; by?: string | null; for?: string | null; session?: string | null; lines: string[] }, path = "/e"): string {
  const q = new URLSearchParams();
  if (doc.title) q.set("title", doc.title);
  if (doc.by) q.set("by", doc.by);
  if (doc.for) q.set("for", doc.for);
  if (doc.session) q.set("session", doc.session);
  for (const l of doc.lines) if (l.trim()) q.append("b", l.trim());
  return `${origin}${path}?${q.toString()}`;
}

/** A short example a model can copy and adapt. */
export const EXAMPLE_URL =
  "https://abedkadaan.com/e?title=A+tour+for+Sam&by=Claude&for=Sam%2C+a+product+designer&b=h:The+idea+in+one+line&b=p:A+URL+can+name+a+computation%2C+not+only+a+document.&b=flow:Address>Program>State>Transition>Result&b=x:/map/eca/90/8/state/5/next&b=research:purl&b=note:Proposed%2C+not+yet+shown%3A+that+AI+systems+will+use+this+on+their+own.";
