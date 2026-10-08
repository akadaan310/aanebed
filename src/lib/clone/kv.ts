/**
 * Storage for clones: a key-value interface whose only write is
 * create-if-absent. That single primitive gives an append-only log (history is
 * never rewritten) and optimistic concurrency (two writers cannot take the same
 * sequence number). Deletion removes a whole clone on its owner's request.
 */
export interface Kv {
  readonly kind: "memory" | "vercel-blob";
  /** Write once. Returns false (and writes nothing) when the key already exists. */
  create(key: string, value: string): Promise<boolean>;
  read(key: string): Promise<string | null>;
  list(prefix: string): Promise<string[]>;
  removePrefix(prefix: string): Promise<number>;
}

export class MemoryKv implements Kv {
  readonly kind = "memory" as const;
  private m = new Map<string, string>();
  async create(key: string, value: string) { if (this.m.has(key)) return false; this.m.set(key, value); return true; }
  async read(key: string) { return this.m.get(key) ?? null; }
  async list(prefix: string) { return [...this.m.keys()].filter((k) => k.startsWith(prefix)).sort(); }
  async removePrefix(prefix: string) { let n = 0; for (const k of [...this.m.keys()]) if (k.startsWith(prefix)) { this.m.delete(k); n++; } return n; }
}

/** The subset of @vercel/blob this store uses, so it can be tested against a fake with the same semantics. */
export interface BlobApi {
  put(pathname: string, body: string, opts: { access: "private"; addRandomSuffix: false; allowOverwrite: false; contentType: string; token?: string }): Promise<unknown>;
  get(pathname: string, opts: { access: "private"; useCache: false; token?: string }): Promise<{ stream: ReadableStream<Uint8Array> } | null>;
  list(opts: { prefix: string; cursor?: string; limit?: number; token?: string }): Promise<{ blobs: { pathname: string; url: string }[]; cursor?: string; hasMore: boolean }>;
  del(urls: string[], opts?: { token?: string }): Promise<void>;
}

export class BlobKv implements Kv {
  readonly kind = "vercel-blob" as const;
  constructor(private api: BlobApi, private token?: string) {}
  async create(key: string, value: string) {
    try {
      await this.api.put(key, value, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", token: this.token });
      return true;
    } catch (e) {
      if (/already exists|BlobAlreadyExists|overwrite/i.test(`${(e as Error).name} ${(e as Error).message}`)) return false;
      throw e;
    }
  }
  async read(key: string) {
    const r = await this.api.get(key, { access: "private", useCache: false, token: this.token });
    return r ? await new Response(r.stream).text() : null;
  }
  async list(prefix: string) {
    const out: string[] = [];
    let cursor: string | undefined;
    do { const r = await this.api.list({ prefix, cursor, limit: 1000, token: this.token }); out.push(...r.blobs.map((b) => b.pathname)); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
    return out.sort();
  }
  async removePrefix(prefix: string) {
    let n = 0, cursor: string | undefined;
    do {
      const r = await this.api.list({ prefix, cursor, limit: 1000, token: this.token });
      if (r.blobs.length) { await this.api.del(r.blobs.map((b) => b.url), { token: this.token }); n += r.blobs.length; }
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return n;
  }
}

const g = globalThis as unknown as { __cloneKv?: Kv };

/**
 * Production uses the Vercel Blob store connected to this project
 * (BLOB_READ_WRITE_TOKEN, set by the integration). Memory is used only when
 * asked for explicitly (CLONE_STORE=memory) or outside production, and the
 * API says so in every response. Never silently in production.
 */
export async function getKv(env: Record<string, string | undefined> = process.env): Promise<Kv | null> {
  if (g.__cloneKv) return g.__cloneKv;
  if (env.CLONE_STORE === "memory" || (!env.BLOB_READ_WRITE_TOKEN && env.NODE_ENV !== "production")) return (g.__cloneKv = new MemoryKv());
  if (env.BLOB_READ_WRITE_TOKEN) {
    const blob = await import("@vercel/blob");
    return (g.__cloneKv = new BlobKv(blob as unknown as BlobApi));
  }
  return null;
}
export function setKvForTests(kv: Kv | undefined) { g.__cloneKv = kv; }
