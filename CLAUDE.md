# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Atelier N°9 — a custom-perfume e-commerce SPA (Manila-based, prices in PHP). Customers compose a fragrance from top/heart/base notes in a 3D builder, browse premade blends, and place hand-mix orders.

## Commands

```bash
npm run dev       # Vite dev server on port 5173
npm run build     # tsc --noEmit (the only typecheck) + vite build
npm run preview   # serve the production build
```

There are no tests and no linter; `npm run build` is the verification gate.

`api/curate.ts` is a Vercel serverless function — the Vite dev server does **not** serve it, so `/api/curate` 404s locally (the concierge UI degrades gracefully). It runs on Vercel deploys or `vercel dev`.

## Environment

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local` — client-side, optional (see below).
- `GEMINI_API_KEY` — server-side only, used by `api/curate.ts`.

## Architecture

Vite + React 18 + TypeScript + Tailwind. Routes live in `src/App.tsx`: `/` (landing), `/builder`, `/collection`, `/account`, `/admin`. `vercel.json` rewrites everything to `index.html`.

### Domain model

- The three note layers are `NoteKey = 'top' | 'heart' | 'base'` (`src/data/ingredients.ts`). Almost everything is keyed by it.
- Blend percentages must always total exactly 100. `rebalance()` in `src/lib/blend.ts` implements this: changing one slider redistributes the difference proportionally across unlocked notes using the largest-remainder method. Don't set percentages directly — go through this.
- `src/lib/recipe.ts` converts percentages into mL/drops at 15–25% oil concentration (physical mixing instructions); `src/lib/pricing.ts` and `src/lib/costing.ts` handle PHP pricing and supplier cost math.

### State: Zustand stores (`src/store/`)

- `useScentStore` — builder state (percentages, locks, selected ingredients, name, bottle size, concentration, solvent).
- `useCatalogStore` — loads all admin-configured Supabase data on app start (stock, availability, custom ingredients/premades, pricing, images) and merges it over the built-in defaults.
- `useAuthStore`, `useCartStore` — session and persistent cart.

### Registry pattern (important)

Admin data fetched from Supabase is pushed into module-level singletons so pure functions can resolve it without React plumbing: `registerCustomIngredients()` in `src/data/ingredients.ts`, `registerPricing()`/`registerPremadePrices()` in `src/lib/pricing.ts`. `useCatalogStore.load()` calls the register functions **before** `set()` so lookups resolve when components re-render. Follow this pattern for new admin-configurable data.

### Supabase is optional everywhere

`src/lib/supabase.ts` exports a `null` client when env vars are missing. Every data-layer function (`src/lib/catalog.ts`, `src/lib/orders.ts`) guards `if (!supabase)` and returns defaults or an error string. Write functions return `string | null` (error message or success), never throw.

Conventions the whole catalog layer relies on:
- **No row = default**: missing stock row means "in stock", missing availability row means "available", missing price row means "use builder pricing".
- **Schema tolerance**: migrations shipped incrementally, so code falls back when a column/table doesn't exist yet (e.g. `fetchStock` retries without the `hidden` column).
- **Images in Storage**: admin-uploaded perfume/hero photos go to the public `product-images` bucket via `uploadImage()` (`src/lib/catalog.ts`); their public URLs are saved in the `premade_images`/`hero_images` tables and shown over the generative visuals (cards, `HeroSlider`, `ScentWash`). Admin UI: `ImageUploadField` (shared), used by `PerfumeEditor` and `HeroEditor`.

The schema lives only as SQL blocks in `SUPABASE_SETUP.md` — there are no migration files. When adding a table: enable RLS, use the established "public read / admin write via `public.admins` exists-check" policy pattern, and document the SQL in `SUPABASE_SETUP.md`.

### 3D bottle (`src/components/three/`)

React Three Fiber renders a procedural glass bottle. `LiquidLayers` pours three liquid layers sized by the live percentages (merging into one color when "blended"); `BottleLabel` prints the custom name in real time. `Scene` drives the builder; `BottleShowcase` reuses the same `Bottle` on the landing (lazy-mounted on scroll, drag-to-spin, zoom disabled so the page still scrolls).

### AI Scent Concierge

`api/curate.ts` — a deliberately **single-file** ESM function (Vercel doesn't resolve extensionless relative imports, so don't split it or import from `src/`). It calls Google Gemini (`gemini-flash-latest` rolling alias — pinned versions age out of the free tier) with a structured-output schema, and is designed so the provider section can be swapped for the Claude API without changing the `CurateResult` shape. The client (`src/components/ui/ScentConcierge.tsx`) POSTs conversation + available ingredients to `/api/curate` and can load the returned formula into the builder.

### Design system (mid-redesign — read before restyling)

The app is transitioning to an "Abel-style" light editorial look. All theme tokens live in `tailwind.config.js`; there is no CSS-variable layer. Three token groups coexist, and knowing which is which prevents wrong-palette edits:

- **Primary editorial tokens** (`paper`, `ink`, `line`, `muted`, …) — the current light identity. Use these for new/redesigned components.
- **Legacy tokens** (`ivory`, `gold`, `stone`, `night-*`, …) — kept so pre-redesign files compile untouched. The light ones (`ivory` → `paper`, etc.) are **remapped to the editorial palette** so old components restyle for free; the `night-*` dark tokens are **inert** (the `dark` class is never applied) and exist only to keep unconverted files building. Don't build new UI on these.
- **"Radical Luxury" palette** (`bone`, `graphite`, `lime`, …) — a distinct scheme sourced from `assets/DESIGN.md` (a full Material-style token + type spec), used by the header/footer (`App.tsx`, `Header.tsx`) and the landing (`LandingPage.tsx`, `HeroSlider.tsx`, `LandingProductCard.tsx`); the rest of the app does not.

Fonts are loaded in `index.html` and mapped to families in the config (`display`/`caslon` serifs for headings, `grotesk`/`hanken`/`sans` for body, `jetbrains` mono). When restyling a page, match the palette already in use on that page rather than mixing groups.

## Previewing

`.claude/launch.json` defines a `dev` server config (port 5173) for the browser preview tools.

## Workflow Orchestration
### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update "tasks/lessons.md" with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until the mistake rate drops
- Review lessons at session start for the relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
### 5.Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to "tasks/todo.md" with checkable items
2. **Verify Plane**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to "tasks/todo.md"
6. **Capture Lessons**: Update 'tasks/lessons.md" after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing gigs.