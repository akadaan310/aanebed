import { parseExperience, GRAMMAR_VERSION } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/experience-request";

/**
 * GET /e.json?…: the document a composed-experience URL encodes, with its id,
 * warnings and errors. A composer can fetch this to check its URL before
 * handing it to a person. Nothing is stored.
 */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const r = parseExperience(url.searchParams, RESEARCH_IDS, req.url.length);
  const view = `https://abedkadaan.com/e${url.search}`;
  return new Response(
    JSON.stringify({ grammar: GRAMMAR_VERSION, valid: r.errors.length === 0, id: r.id, view, errors: r.errors, warnings: r.warnings, document: r.doc, stored: false }, null, 1),
    { status: r.errors.length ? 422 : 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex" } },
  );
}
