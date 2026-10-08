/**
 * A Pearl's address carries the whole Pearl: JSON → deflate → base64url, in the path
 * /pearl/{code}. Nothing is stored on a server; the link is the object.
 * Uses CompressionStream, available in modern browsers and in Node.
 */
import { normalize, type Pearl } from "./model";

export const MAX_CODE = 12_000;

const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  const reader = out.body!.getReader();
  const chunks: Uint8Array[] = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > limit) { await reader.cancel(); throw new Error("too large"); }
    chunks.push(value);
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  return all;
}

export async function encode(p: Pearl): Promise<string> {
  return b64url(await pipe(new TextEncoder().encode(JSON.stringify(p)), new CompressionStream("deflate-raw")));
}

/** Decode and validate. Returns null for anything that isn't a whole, valid Pearl (cut-off links included). */
export async function decode(code: string): Promise<Pearl | null> {
  if (!code || code.length > MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const bytes = await pipe(unb64url(code), new DecompressionStream("deflate-raw"), 64 * 1024);
    return normalize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}

export const pathOf = (code: string) => `/pearl/${code}`;
