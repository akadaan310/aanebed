/**
 * The one place the public origin is defined.
 *
 * Every absolute URL the site emits (copy buttons, AI instructions, manifests,
 * canonical links, Pearl links) is built from ORIGIN. To move to a custom
 * domain, change ORIGIN here, add it to TRUSTED_ORIGINS, and redeploy.
 *
 * Absolute URLs are never built from request headers (Host, X-Forwarded-Host),
 * which a client can set.
 */
export const ORIGIN = "https://aanebed.vercel.app" as const;
export const HOST = new URL(ORIGIN).host;

/** Origins whose Pearl URLs this site recognises when a person pastes one. */
export const TRUSTED_ORIGINS: readonly string[] = [
  ORIGIN,
  "https://abedkadaan.com", // the planned custom domain; not serving this app yet
  "https://www.abedkadaan.com",
  "http://localhost:3000",
  "http://localhost:3100",
];

export const abs = (path: string) => (path.startsWith("http") ? path : ORIGIN + (path.startsWith("/") ? path : "/" + path));
