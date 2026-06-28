# Armored Focus

A gamified CRM for insurance agents, themed as a medieval RPG. Clients are
collectible **cards** kept in a **binder**, tasks are **quests** that award
**Exp** toward **levels**, and your day's activity scrolls past in **Today's
Scroll**. Built as a SvelteKit app that runs entirely on Cloudflare.

> Rewritten from the original single-file React prototype. The full behavior
> specification lives in [`SPEC.md`](./SPEC.md) — it is the source of truth for
> what the app should do.

## Stack

| Layer | Choice |
|---|---|
| Frontend + backend | **SvelteKit** (Svelte 5 runes) on **Cloudflare** via `@sveltejs/adapter-cloudflare` |
| Database | **Cloudflare D1** (SQLite) |
| Styling | **Tailwind CSS** |
| Tests | **Vitest** |

### Architecture: functional core, imperative shell

- **`src/lib/core/`** — pure, side-effect-free game logic (Exp/leveling, quest
  transitions, urgency, relationship score, sorting/search, booster import,
  households). No I/O; time and id generation are injected. Heavily unit-tested.
- **`src/lib/server/`** — the D1 data layer (schema mappers + repository). The
  only place that touches the database.
- **`src/lib/state.svelte.ts`** — the browser-side store: mutates state via the
  core and persists every change to D1 through `/api/persist`.
- **`src/lib/components/`, `src/lib/views/`, `src/routes/`** — the UI.

## Getting started

```bash
npm install

# Create the local D1 database schema (one time)
npm run db:migrate:local

npm run dev          # http://localhost:5173
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Run the app locally (Vite + emulated Cloudflare bindings) |
| `npm test` | Run the Vitest unit suite |
| `npm run check` | Type-check with `svelte-check` |
| `npm run build` | Production build for Cloudflare |
| `npm run preview` | Preview the production build locally |
| `npm run db:migrate:local` | Apply D1 migrations to the local database |
| `npm run db:migrate:remote` | Apply D1 migrations to the remote (Cloudflare) database |
| `npm run deploy` | Build and deploy with Wrangler |

## Deploying to Cloudflare

1. **Authenticate** Wrangler: `npx wrangler login`.
2. **Create the D1 database:**
   ```bash
   npx wrangler d1 create armored_focus
   ```
   Copy the printed `database_id` into [`wrangler.toml`](./wrangler.toml)
   (replace the placeholder `00000000-…`).
3. **Apply migrations** to the remote DB:
   ```bash
   npm run db:migrate:remote
   ```
4. **Deploy:**
   ```bash
   npm run deploy
   ```

## Status & notes

- **Auth is deferred.** v1 runs as a single default user, but the schema is
  auth-ready: every owned row carries a `user_id`, so login can be layered on
  later without a data migration (see `SPEC.md` §6).
- The rewrite deliberately **fixes the prototype's known bugs** (real level-ups,
  working search, functional bonus board, distinct Exp/Commission sorts, etc.).
  See `SPEC.md` §9 for the full list.
- Currency is **Exp-only** for v1 (no coins).
