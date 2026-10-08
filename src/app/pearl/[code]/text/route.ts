import { decode } from "@/lib/pearls/codec";
import { pearlText } from "@/lib/pearls/model";
import { verify } from "@/lib/pearls/seal";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";

/** The Pearl as plain text: for an AI that opens the link, and for anyone reading. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const p = await decode(code);
  const head = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=31536000, immutable", "X-Robots-Tag": "noindex" };
  if (!p) return new Response("This link doesn't hold a whole Pearl (it may have been cut off when copied).\n", { status: 404, headers: head });
  const s = verify(p);
  const seal = s === "verified" ? "\nThe newest contribution was recorded by Pearls when the model made it (sealed; verified on this content).\n" : s === "unverified" ? "\nThe newest contribution claims to be a model's, but its seal doesn't match this content.\n" : "";
  return new Response(pearlText(p, `${ORIGIN}/pearl/${code}`) + seal + `\nTo continue it: do the work, then end with a \`\`\`pearl JSON block (title, kind, essence, blocks, next, by, note) so the person can bring it back to ${ORIGIN}.\n`, { headers: head });
}
