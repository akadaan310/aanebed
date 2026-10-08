/**
 * Pearls — the object at the centre of the product.
 *
 * A Pearl is a small, finished piece of work: a title, an essence, a few
 * structured blocks (some of them playable), the words it began from, a few
 * ways it could grow, and the hands that made it. It is self-contained: the
 * whole Pearl travels in its link and in a plain-text form any AI can read.
 *
 * Isomorphic: runs in the browser and on the server.
 */
import { canonical, sha256, type Json } from "../canonical";

export const FORMAT = "pearls/1" as const;
export const KINDS = ["idea", "game", "study", "story", "plan", "research", "project", "note"] as const;
export type Kind = (typeof KINDS)[number];

export type Block =
  | { t: "text"; heading: string; body: string }
  | { t: "list"; heading: string; items: string[] }
  | { t: "steps"; heading: string; items: string[] }
  | { t: "cards"; heading: string; cards: { front: string; back: string }[] }
  | { t: "quiz"; heading: string; questions: { q: string; options: string[]; answer: number; why: string }[] };

/** One contribution. `by: "model"` is recorded by this site's server and sealed; `another-ai` is what a pasted reply says about itself. */
export interface Hand {
  by: "you" | "model" | "another-ai" | "pearls";
  how: "made" | "shaped" | "edited" | "grown" | "continued";
  at: string;
  model?: string;
  name?: string;
  note?: string;
  sig?: string;
}

export interface Pearl {
  format: typeof FORMAT;
  title: string;
  kind: Kind;
  essence: string;
  blocks: Block[];
  origin: string;
  next: string[];
  hands: Hand[];
  from: { id: string; title: string } | null;
}

export const LIMITS = { title: 90, essence: 220, heading: 80, body: 2400, item: 300, items: 14, blocks: 10, cards: 14, questions: 12, options: 5, origin: 3000, next: 4, nextChars: 120, hands: 24, note: 240, json: 30_000 } as const;

// eslint-disable-next-line no-control-regex
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, max) : "");
const line = (s: unknown, max: number) => clean(s, max).replace(/\s+/g, " ");
const strs = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v : []).map((x) => line(x, max)).filter(Boolean).slice(0, n);

export function normalizeBlock(raw: unknown): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const heading = line(b.heading, LIMITS.heading);
  switch (b.t ?? b.type) {
    case "text": { const body = clean(b.body ?? b.text, LIMITS.body); return body ? { t: "text", heading, body } : null; }
    case "list": case "steps": { const items = strs(b.items, LIMITS.items, LIMITS.item); return items.length ? { t: (b.t ?? b.type) as "list" | "steps", heading, items } : null; }
    case "cards": {
      const cards = (Array.isArray(b.cards) ? b.cards : []).map((c) => ({ front: line((c as Record<string, unknown>)?.front, LIMITS.item), back: clean((c as Record<string, unknown>)?.back, LIMITS.item) })).filter((c) => c.front && c.back).slice(0, LIMITS.cards);
      return cards.length ? { t: "cards", heading, cards } : null;
    }
    case "quiz": {
      const questions = (Array.isArray(b.questions) ? b.questions : []).map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const options = strs(o.options, LIMITS.options, LIMITS.item);
        const answer = Number.isInteger(o.answer) ? (o.answer as number) : -1;
        return { q: line(o.q, LIMITS.item), options, answer, why: line(o.why, LIMITS.item) };
      }).filter((q) => q.q && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length).slice(0, LIMITS.questions);
      return questions.length ? { t: "quiz", heading, questions } : null;
    }
    default: return null;
  }
}

function normalizeHand(raw: unknown): Hand | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as Record<string, unknown>;
  const by = (["you", "model", "another-ai", "pearls"] as const).find((x) => x === h.by);
  const how = (["made", "shaped", "edited", "grown", "continued"] as const).find((x) => x === h.how);
  if (!by || !how) return null;
  const at = typeof h.at === "string" && !Number.isNaN(Date.parse(h.at)) ? new Date(h.at).toISOString() : "";
  if (!at) return null;
  const out: Hand = { by, how, at };
  const model = line(h.model, 60), name = line(h.name, 80), note = line(h.note, LIMITS.note), sig = line(h.sig, 80);
  if (model) out.model = model;
  if (name) out.name = name;
  if (note) out.note = note;
  if (sig && /^[0-9a-f]{64}$/.test(sig)) out.sig = sig;
  return out;
}

/** Validate anything that claims to be a Pearl (from a link, a paste, an AI). Never throws. */
export function normalize(raw: unknown): Pearl | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = line(r.title, LIMITS.title);
  const blocks = (Array.isArray(r.blocks) ? r.blocks : []).map(normalizeBlock).filter((b): b is Block => !!b).slice(0, LIMITS.blocks);
  if (!title || !blocks.length) return null;
  const kind = (KINDS as readonly string[]).includes(String(r.kind)) ? (r.kind as Kind) : "idea";
  const f = r.from as Record<string, unknown> | null | undefined;
  const from = f && typeof f === "object" && /^p_[0-9a-f]{12}$/.test(String(f.id)) ? { id: String(f.id), title: line(f.title, LIMITS.title) } : null;
  const p: Pearl = {
    format: FORMAT, title, kind, essence: line(r.essence, LIMITS.essence), blocks,
    origin: clean(r.origin, LIMITS.origin), next: strs(r.next, LIMITS.next, LIMITS.nextChars),
    hands: (Array.isArray(r.hands) ? r.hands : []).map(normalizeHand).filter((h): h is Hand => !!h).slice(-LIMITS.hands),
    from,
  };
  return JSON.stringify(p).length <= LIMITS.json ? p : null;
}

/** The content a seal covers and the id is computed from: everything except the seals themselves. */
export const unsealed = (p: Pearl) => ({ ...p, hands: p.hands.map(({ sig: _s, ...h }) => h) }) as unknown as Json;
export const digest = (p: Pearl) => sha256(canonical(unsealed(p)));
export const idOf = (p: Pearl) => "p_" + digest(p).slice(0, 12);

/** What each contribution looks like to a person. */
export function handLabel(h: Hand): string {
  const who = h.by === "you" ? "a person" : h.by === "model" ? modelName(h.model) : h.by === "pearls" ? "the Pearls team" : h.name ? `another AI (${h.name}, as it says)` : "another AI";
  const verb = { made: "Made by", shaped: "Shaped by", edited: "Edited by", grown: "Grown by", continued: "Continued by" }[h.how];
  return h.how === "made" && h.by === "you" ? "Born from an idea" : `${verb} ${who}`;
}
export function modelName(id?: string): string {
  if (!id) return "an AI model";
  const m = /^claude-(haiku|sonnet|opus|fable)-(\d+)-(\d+)/.exec(id);
  return m ? `Claude ${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}.${m[3]}` : id;
}

/** A gentle, content-derived identity: hue and a few shape parameters, for the Pearl's appearance. */
export function look(p: Pearl) {
  const d = digest(p);
  const n = (i: number) => parseInt(d.slice(i, i + 4), 16) / 0xffff;
  return { hue: Math.round(n(0) * 360), tilt: Math.round(n(4) * 360), sheen: 0.35 + n(8) * 0.4, layers: Math.max(1, Math.min(7, p.hands.length)), seed: d.slice(0, 8) };
}

/* ---------- Making a Pearl without any AI: the person's words, given form ---------- */

const KIND_HINTS: [Kind, RegExp][] = [
  ["game", /\b(game|games|puzzle|quiz|levels?|high score)\b/i],
  ["study", /\b(study|exam|revise|revision|learn|flashcards?|notes? (on|for)|homework|lesson)\b/i],
  ["story", /\b(story|once upon|chapter|character|poem|novel|tale)\b/i],
  ["plan", /\b(plan|schedule|steps?|roadmap|goal|weekend|trip|routine)\b/i],
  ["research", /\b(research|study shows|hypothesis|evidence|paper|experiment|data)\b/i],
  ["project", /\b(build|app|code|website|prototype|ship|product|tool)\b/i],
];
/** The first line says most about what something is; the rest is a fallback. */
export const guessKind = (s: string): Kind => {
  const head = s.split("\n")[0];
  return KIND_HINTS.find(([, re]) => re.test(head))?.[0] ?? KIND_HINTS.find(([, re]) => re.test(s))?.[0] ?? (s.length < 140 ? "idea" : "note");
};

export const NEXT_BY_KIND: Record<Kind, string[]> = {
  idea: ["Turn it into a first plan", "Find the strongest version of it", "List what could go wrong"],
  game: ["Add a harder level", "Make it playable in five minutes", "Write the rules for a friend"],
  study: ["Make practice questions", "Explain it to a ten-year-old", "Find the three things to remember"],
  story: ["Write what happens next", "Tell it from another character", "Give it an ending"],
  plan: ["Break the first step down", "Find what could block it", "Make a checklist for today"],
  research: ["Find the strongest objection", "Design a small test", "Summarise it for a newcomer"],
  project: ["Write the first version's scope", "List the first three tasks", "Describe it to a user"],
  note: ["Give it a structure", "Pull out the key points", "Turn it into something to share"],
};

/** Give a person's own words a form: title, essence, blocks. No words are invented. */
export function fromWords(text: string, at = new Date().toISOString()): Pearl | null {
  const src = clean(text, LIMITS.origin);
  if (!src) return null;
  const lines = src.split("\n");
  const first = lines.find((l) => l.trim())!.replace(/^#+\s*/, "").trim();
  const title = first.length <= LIMITS.title ? first : first.slice(0, LIMITS.title - 1).replace(/\s+\S*$/, "") + "…";
  const blocks: Block[] = [];
  let heading = "";
  const paras = src.split(/\n\s*\n/);
  for (const raw of paras) {
    const ls = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!ls.length) continue;
    if (ls.length === 1 && /^#+\s/.test(ls[0])) { heading = ls[0].replace(/^#+\s*/, "").slice(0, LIMITS.heading); continue; }
    const qa = ls.join("\n").match(/^Q:\s*.+\nA:\s*.+/gim);
    if (qa && qa.length >= 1 && ls.every((l) => /^(Q|A):/i.test(l))) {
      const cards = [];
      for (let i = 0; i + 1 < ls.length; i += 2) cards.push({ front: ls[i].replace(/^Q:\s*/i, ""), back: ls[i + 1].replace(/^A:\s*/i, "") });
      blocks.push({ t: "cards", heading, cards: cards.slice(0, LIMITS.cards) }); heading = ""; continue;
    }
    if (ls.every((l) => /^([-*•]|\d+[.)])\s+/.test(l))) {
      const numbered = /^\d/.test(ls[0]);
      blocks.push({ t: numbered ? "steps" : "list", heading, items: ls.map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, "").slice(0, LIMITS.item)).slice(0, LIMITS.items) }); heading = ""; continue;
    }
    blocks.push({ t: "text", heading, body: ls.join("\n").slice(0, LIMITS.body) }); heading = "";
  }
  if (blocks.length && blocks[0].t === "text" && blocks[0].body.split("\n")[0].replace(/^#+\s*/, "").trim() === first) {
    const rest = blocks[0].body.split("\n").slice(1).join("\n").trim();
    if (rest) blocks[0] = { ...blocks[0], body: rest }; else blocks.shift();
  }
  if (!blocks.length) blocks.push({ t: "text", heading: "", body: src.slice(0, LIMITS.body) });
  const firstText = blocks.find((b) => b.t === "text") as Extract<Block, { t: "text" }> | undefined;
  const essence = firstText && firstText.body !== title ? (firstText.body.match(/^[^.!?\n]{8,200}[.!?]/)?.[0] ?? "") : "";
  const kind = guessKind(src);
  return normalize({ format: FORMAT, title, kind, essence, blocks: blocks.slice(0, LIMITS.blocks), origin: src, next: NEXT_BY_KIND[kind], hands: [{ by: "you", how: "made", at }], from: null });
}

/* ---------- The portable form: what any AI can read, with or without opening links ---------- */

export function blocksText(blocks: Block[]): string {
  return blocks.map((b) => {
    const h = b.heading ? `## ${b.heading}\n` : "";
    switch (b.t) {
      case "text": return h + b.body;
      case "list": return h + b.items.map((i) => `- ${i}`).join("\n");
      case "steps": return h + b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
      case "cards": return h + b.cards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join("\n");
      case "quiz": return h + b.questions.map((q, n) => `${n + 1}. ${q.q}\n${q.options.map((o, i) => `   ${"abcde"[i]}) ${o}`).join("\n")}\n   answer: ${"abcde"[q.answer]}${q.why ? ` — ${q.why}` : ""}`).join("\n");
    }
  }).join("\n\n");
}

export const RETURN_SHAPE = `{"title":"…","kind":"idea|game|study|story|plan|research|project|note","essence":"one line","blocks":[{"t":"text","heading":"","body":"…"},{"t":"list","heading":"","items":["…"]},{"t":"steps","heading":"","items":["…"]},{"t":"cards","heading":"","cards":[{"front":"…","back":"…"}]},{"t":"quiz","heading":"","questions":[{"q":"…","options":["…","…"],"answer":0,"why":"…"}]}],"next":["a way it could grow"],"by":"your model name, if you know it","note":"what you changed"}`;

/** The Pearl as text: what it is, what it contains, where it came from. */
export function pearlText(p: Pearl, link: string | null): string {
  const history = p.hands.map((h, i) => `${i + 1}. ${handLabel(h)}${h.model ? ` (${h.model}${h.sig ? ", recorded by Pearls" : ""})` : ""}, ${h.at.slice(0, 10)}${h.note ? ` — ${h.note}` : ""}`).join("\n");
  return `PEARL: "${p.title}"
A Pearl is a small, finished piece of work that a person made and kept on Pearls (${link ? new URL(link).origin : "aanebed.vercel.app"}). It travels as a link and as this text, so you don't need to open anything: everything is below.

Kind: ${p.kind} · id ${idOf(p)}${p.from ? ` · grown from "${p.from.title}" (${p.from.id})` : ""}
${link ? `Link: ${link}\n` : ""}
ESSENCE
${p.essence || "—"}

CONTENT
${blocksText(p.blocks)}

WHERE IT BEGAN (the person's own words)
${p.origin || "—"}

HISTORY
${history || "—"}
`;
}

/** The Pearl as text for another AI: the Pearl, what is being asked, and how to answer so it can come back. */
export function forAI(p: Pearl, link: string | null, ask?: string): string {
  return `${pearlText(p, link)}
WHAT THE PERSON ASKS
${ask?.trim() || (p.next[0] ? `Grow this Pearl. One direction they might like: ${p.next[0]}.` : "Grow this Pearl: take it one step further.")}

HOW TO ANSWER
Do the work in your reply, building on this Pearl rather than starting over. Then, so the person can bring it back to Pearls, end with a code block labelled pearl that holds the new version as JSON:
\`\`\`pearl
${RETURN_SHAPE}
\`\`\`
Use only those block types. "answer" is the index of the right option. Say who you are in "by" only if you know it. You can't send hidden instructions, private memory or internal reasoning, and shouldn't invent them.`;
}

/** Read a Pearl back from an AI's reply (or anything pasted): a ```pearl or ```json block, or the first JSON object. */
export function fromReply(text: string, parent: Pearl | null, at = new Date().toISOString()): Pearl | null {
  const cands = [text.match(/```pearl\s*([\s\S]*?)```/i)?.[1], text.match(/```json\s*([\s\S]*?)```/i)?.[1], text.includes("{") ? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1) : undefined];
  for (const c of cands) {
    if (!c) continue;
    let j: Record<string, unknown>;
    try { j = JSON.parse(c); } catch { continue; }
    if (!j || typeof j !== "object") continue;
    const hand: Hand = { by: "another-ai", how: "continued", at };
    const by = line(j.by, 80); if (by) hand.name = by;
    const note = line(j.note, LIMITS.note); if (note) hand.note = note;
    const p = normalize({
      ...j, format: FORMAT,
      origin: parent?.origin ?? clean(text.replace(/```[\s\S]*?```/g, "").trim() || "Brought back from another AI", LIMITS.origin),
      hands: [...(parent?.hands ?? []), hand],
      from: parent ? { id: idOf(parent), title: parent.title } : null,
      next: Array.isArray(j.next) && j.next.length ? j.next : NEXT_BY_KIND[(KINDS as readonly string[]).includes(String(j.kind)) ? (j.kind as Kind) : "idea"],
    });
    if (p) return p;
  }
  return null;
}

/** Markdown, for keeping a Pearl as a file. */
export function toMarkdown(p: Pearl, link: string | null): string {
  return `# ${p.title}\n\n${p.essence ? `*${p.essence}*\n\n` : ""}${blocksText(p.blocks)}\n\n---\n\nWhere it began: ${p.origin.replace(/\n/g, " ")}\n\n${p.hands.map((h) => `- ${handLabel(h)} · ${h.at.slice(0, 10)}`).join("\n")}\n\n${link ? `Open it: ${link}\n` : ""}Pearl ${idOf(p)}\n`;
}
