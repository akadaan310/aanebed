# Future persistence: from browser-local to shared

Nothing here is implemented in this phase. No Supabase, no accounts, no environment variables.

## The seam that exists today

`src/lib/pearl/workspace.ts` defines the data (`PearlRecord`, `Space`, `Project`, `Note`, `Task`) as pure functions, and one boundary:

```ts
interface WorkspaceRepository { kind: "browser-local" | "server"; load(): Workspace; save(ws: Workspace): void }
```

`LocalWorkspaceRepository` implements it over `localStorage`. The resolver takes a `LocalLookup`; a server lookup would be a second implementation. The UI only uses `useWorkspace().update(f)` with pure `f`.

## Proposed model (Postgres / Supabase)

| Table | Key fields | Notes |
|---|---|---|
| users | id, created_at | Supabase Auth; no passwords handled by this app |
| pearls | digest (pk), id, format, type, canonical jsonb, created_at | immutable, content-addressed; one row per distinct content |
| pearl_versions | id, digest, derived_from_digest, author_user, created_at | lineage; an update never mutates an existing row |
| library_items | user_id, digest, name, tags, pinned, space_id, project_id, modified_at | per-user metadata (today's `PearlRecord` minus content) |
| spaces, projects, notes, tasks | user_id + today's fields | |
| shares | token_hash, digest, scope (read), expires_at, revoked_at | capability links for private Pearls |
| events | user_id, kind, subject, at | append-only audit |

Access control: row-level security by `user_id` on every per-user table; `pearls` readable only through a library item, a public flag, or a valid share capability. A content hash is never an access control.

## Durable short links

`/p/{id}` (no payload) would resolve via `pearls.id` → `digest` for public Pearls or with a share token (`/p/{id}?k=…`) for private ones. Writes are idempotent by digest.

## Migration from local

On first sign-in, offer to upload the local library: build a `pearl-export` from `localStorage`, run the existing `planImport` server-side (same re-validation), show the preview, then apply. The local copy is kept until the user clears it.

## Deletion and export

Users can export at any time (the same `pearl-export` format) and delete their account: library items, spaces, projects, notes, tasks and shares are deleted; immutable `pearls` rows no longer referenced by anyone are deleted.

## The continuity brain

`supabase/migrations/0001_continuity_brain.sql` (ACSP-CB/0.1) is the shared-append design for many sessions on one record. It is tested on PostgreSQL 16. Enabling it requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and a decision on write authorisation (today: the link is the capability).
