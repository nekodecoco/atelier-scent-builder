# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

Atelier N°9 — a custom-perfume e-commerce SPA (Manila-based, prices in PHP). Customers compose a fragrance from top/heart/base notes in a 3D builder, browse premade blends, and place hand-mix orders.

## Commands

```bash
npm run dev       # Vite dev server on :5173
npm run build     # tsc --noEmit (the only typecheck) + vite build — the verification gate
npm run preview   # serve the production build
```

No tests, no linter. `api/curate.ts` is a Vercel function the Vite dev server does **not** serve, so `/api/curate` 404s locally (the concierge degrades gracefully); it runs on Vercel or `vercel dev`. `.claude/launch.json` defines the `dev` server for the browser preview tools.

## Environment

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local` — client-side, optional.
- `GEMINI_API_KEY` — server-side only, used by `api/curate.ts`.

## Architecture

Vite + React 18 + TypeScript + Tailwind + Motion (`motion/react`). Routes in `src/App.tsx`: `/`, `/builder`, `/collection`, `/account`, `/admin`. `vercel.json` rewrites everything to `index.html`.

### Route transitions

`src/components/ui/RouteTransition.tsx` wraps `<Routes location={location}>` in `App.tsx` — the explicit `location` prop is **required** (it lets AnimatePresence keep rendering the outgoing page during its exit; without it the swap is instant). Choreography: exit scale/fade → translucent liquid wave sweeps bottom-to-top (clip-path glass panels) → new page springs up. It skips the initial page load, is `pointer-events-none` throughout, and degrades to a plain crossfade under `prefers-reduced-motion`. In-app navigation must use `<Link>`/`<NavLink>`/`navigate()` — plain `<a href>` causes a full reload and bypasses the transition. Tuning dials (blur, tint alphas, `SWEEP_SECONDS`) live at the top of the file; to screenshot mid-sweep, temporarily raise `SWEEP_SECONDS`, then revert.

### Domain model

- Note layers: `NoteKey = 'top' | 'heart' | 'base'` (`src/data/ingredients.ts`). Almost everything is keyed by it.
- Selection is **1–3 ingredients per note, mixed equally**: `selected: Record<NoteKey, string[]>`. `src/lib/selection.ts` owns it — `MAX_PER_NOTE`, `toggleInNote`, `weightedIngredients` (a note's % split across its ingredients), and `normalizeSelected` which also accepts the legacy single-string shape. Run any persisted/loaded formula (cart, orders, Supabase premades, AI output) through `normalizeSelected` at the load/render boundary.
- Note percentages always total 100 via `rebalance()` in `src/lib/blend.ts` (largest-remainder redistribution across unlocked notes) — never set percentages directly.
- `src/lib/recipe.ts` → mL/drops at 15–25% oil; `pricing.ts`/`costing.ts` → PHP pricing + supplier cost. `color.ts` mixes ingredient colors (`noteColor` per note, `mixFormulaColor` for the blended whole). `scentProfile.ts` (radar traits + character line) and `scentDescription.ts` (`describeScent`, the "how it wears" text) are deterministic, built from ingredient data.

### State: Zustand (`src/store/`)

- `useScentStore` — builder state (percentages, locks, selected, name, bottle size, concentration, solvent, blended).
- `useCatalogStore` — loads all admin Supabase data on start (stock, availability, custom ingredients/premades, pricing, images) over the built-in defaults.
- `useAuthStore`, `useCartStore` — session and persistent cart.

### Registry pattern

Admin Supabase data is pushed into module-level singletons so pure functions resolve it without React plumbing: `registerCustomIngredients()` (`ingredients.ts`), `registerPricing()`/`registerPremadePrices()` (`pricing.ts`). `useCatalogStore.load()` calls these **before** `set()`. Follow this for new admin-configurable data.

### Supabase is optional

`src/lib/supabase.ts` exports `null` when env vars are missing; every data-layer function (`catalog.ts`, `orders.ts`) guards `if (!supabase)` and returns defaults or an error string — write functions return `string | null`, never throw. Conventions: **no row = default** (missing stock = in stock, etc.); **schema tolerance** (code falls back when a column/table is absent); **images** go to the public `product-images` bucket via `uploadImage()`, URLs saved in `premade_images`/`hero_images` and shown over the generative visuals. Schema lives only as SQL in `SUPABASE_SETUP.md` (no migrations) — new tables: enable RLS, use the "public read / admin write via `public.admins` exists-check" policy, and document the SQL there.

### 3D bottle (`src/components/three/`)

React Three Fiber renders a procedural glass bottle. `LiquidLayers` pours three layers sized by live percentages, each colored by `noteColor` (its note's ingredient blend), merging to one color when "blended"; `BottleLabel` prints the name live. `Scene` drives the builder and is now the **only** WebGL entry point — the landing's 3D showcase was replaced by `NoteMarquee`, so no page but `/builder` creates a WebGL context. (three.js still lands in the main bundle, since `Scene` is imported eagerly.)

### AI Scent Concierge

`api/curate.ts` — a deliberately **single-file** ESM function (Vercel can't resolve extensionless relative imports, so don't split it or import from `src/`). Calls Gemini (`gemini-flash-latest` rolling alias — pinned versions age out of the free tier) with a structured-output schema; the provider section can swap to the Claude API without changing `CurateResult`. Client `ScentConcierge.tsx` POSTs to `/api/curate` and loads the returned formula (one id per note; the client normalizes).

### Design system (mid-redesign — read before restyling)

Transitioning to an "Abel-style" light editorial look. Tokens live in `tailwind.config.js` (no CSS-variable layer). Three groups: **editorial** (`paper`, `ink`, `line`, `muted`, …) — use for new UI; **legacy** (`ivory`→`paper` remapped so old files restyle for free; `night-*` dark tokens inert since `dark` is never applied) — don't build on these; **"Radical Luxury"** (`bone`, `graphite`, `lime`, … from `assets/DESIGN.md`) — used by header/footer + landing only. Fonts load in `index.html`. Match the palette already on a page rather than mixing groups.

## Working style

- Plan non-trivial work (3+ steps or design decisions) before building; if it goes sideways, stop and re-plan.
- Keep changes simple and minimal-impact; fix root causes, no temporary hacks; senior-dev standard.
- Never mark done without proof: `npm run build` must pass, and verify behavior in the browser preview when observable.
- After a user correction, capture the lesson so it doesn't recur.
