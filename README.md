# Atelier N°9 — Custom Perfume Scent Builder

A premium custom-perfume e-commerce interface. Compose your own fragrance in an
interactive 3D scent builder, browse the house collection, and place hand-mix orders.

## Features

- **3D scent builder** — a procedural glass bottle (React Three Fiber) with three
  liquid layers that re-pour live as you balance top, heart, and base notes; your
  custom name prints on the bottle label in real time.
- **Smart proportional sliders** — the blend always totals exactly 100%; lock a note
  to hold it while the others rebalance.
- **Premade collection** — six house blends you can add to cart or remix in the builder.
- **Cart & orders** — persistent cart, order requests in PHP pricing, and per-account
  order history backed by Supabase (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)).
- **Hand-mixer's formulation** — converts percentages into mL and drops at 15%
  fragrance-oil concentration for physical mixing.
- Dark luxury theme with a light-mode toggle.

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · React Three Fiber / drei · Zustand ·
React Router · Supabase

## Run it

```bash
npm install
npm run dev
```

Accounts and orders need Supabase keys in `.env.local` — the app runs without them,
with sign-in and checkout showing setup guidance instead.

```bash
npm run build   # typecheck + production build
```
