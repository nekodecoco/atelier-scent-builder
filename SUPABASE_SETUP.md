# Supabase setup — accounts & orders

The app runs fully without Supabase (builder, collection, cart). Sign-in and order
history activate once you connect a free Supabase project.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.

## 2. Add your keys locally

Create a file named `.env.local` in the project root (it is gitignored):

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server afterward (`npm run dev`).

## 3. Create the orders table

Open **SQL Editor** in the Supabase dashboard and run:

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  created_at timestamptz not null default now(),
  status text not null default 'pending',
  total numeric not null,
  currency text not null default 'PHP',
  items jsonb not null
);

alter table public.orders enable row level security;

create policy "read own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);
```

Row Level Security means every user can only ever see and create their own orders.

> **Important — the order-history privacy boundary.** RLS on `orders` is the *only*
> thing stopping one customer from reading another's orders. If it isn't enabled, every
> signed-in customer sees all orders. Verify it in **SQL Editor**:
>
> ```sql
> select relrowsecurity from pg_class where relname = 'orders';        -- must be true
> select policyname, cmd from pg_policies where tablename = 'orders';  -- expect "read own orders" (select)
> ```
>
> If `relrowsecurity` is `false` or the `read own orders` policy is missing, re-run the
> `enable row level security` + `read own orders` / `insert own orders` block above.

## 4. Auth settings

Email/password sign-in is enabled by default. For frictionless local testing, go to
**Authentication → Providers → Email** and turn off **Confirm email** — sign-ups then
work instantly without a confirmation mail. Turn it back on before going live.

## 5. Vercel

Add the same two variables in your Vercel project (**Settings → Environment Variables**),
then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 6. Cross-device cart & saved blends

These power the synced cart (a signed-in customer's cart follows them across devices)
and saved favorite blends. Run in **SQL Editor**:

```sql
-- one cart per user, mirrored across devices (guests keep a localStorage cart)
create table public.carts (
  user_id uuid primary key references auth.users,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;
create policy "own cart" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- a customer's saved builder formulas ("favorite blends")
create table public.saved_blends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  name text not null,
  formula jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.saved_blends enable row level security;
create policy "read own saved blends" on public.saved_blends
  for select using (auth.uid() = user_id);
create policy "insert own saved blends" on public.saved_blends
  for insert with check (auth.uid() = user_id);
create policy "delete own saved blends" on public.saved_blends
  for delete using (auth.uid() = user_id);
```

Both tables degrade gracefully — without them (or without Supabase) the app falls back to
the local cart and hides the saved-blends UI.

## Admin panel (stock, ingredients, orders)

The `/admin` page needs three more tables and an extra column. Run this in **SQL Editor**:

```sql
-- who is allowed to administer the shop
create table public.admins (
  user_id uuid primary key references auth.users
);
alter table public.admins enable row level security;
create policy "read own admin flag" on public.admins
  for select using (auth.uid() = user_id);

-- stock for premade scents (no row = treated as in stock)
create table public.premade_stock (
  scent_id text primary key,
  stock integer not null default 0
);
alter table public.premade_stock enable row level security;
create policy "public read stock" on public.premade_stock
  for select using (true);
create policy "admin write stock" on public.premade_stock
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- which builder ingredients are available (no row = available)
create table public.ingredient_availability (
  ingredient_id text primary key,
  available boolean not null default true
);
alter table public.ingredient_availability enable row level security;
create policy "public read availability" on public.ingredient_availability
  for select using (true);
create policy "admin write availability" on public.ingredient_availability
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- orders: capture customer email + let admins see and update everything
alter table public.orders add column email text;
create policy "admins read all orders" on public.orders
  for select using (exists (select 1 from public.admins where user_id = auth.uid()));
create policy "admins update orders" on public.orders
  for update
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- make yourself the admin (must have signed up in the app first)
insert into public.admins (user_id)
  select id from auth.users where email = 'nikko.alferez@gmail.com';
```

After running it, sign in with that account and an **ADMIN** link appears in the header.

## Custom notes and perfumes

Lets the admin add their own builder ingredients and premade perfumes, and hide
built-in house blends. Run in **SQL Editor**:

```sql
-- admin-created builder ingredients
create table public.custom_ingredients (
  id uuid primary key default gen_random_uuid(),
  note text not null check (note in ('top','heart','base')),
  name text not null,
  description text not null default '',
  color text not null default '#c9a53a',
  scent_twins jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.custom_ingredients enable row level security;
create policy "public read custom ingredients" on public.custom_ingredients
  for select using (true);
create policy "admin write custom ingredients" on public.custom_ingredients
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- admin-created premade perfumes
create table public.custom_premades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null default '',
  description text not null default '',
  formula jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.custom_premades enable row level security;
create policy "public read custom premades" on public.custom_premades
  for select using (true);
create policy "admin write custom premades" on public.custom_premades
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- built-in house blends can now be hidden from the collection
alter table public.premade_stock add column hidden boolean not null default false;
```

## Editable pricing

Lets the admin set builder prices per bottle size (plus the oil surcharge) and
give each premade its own price. Run in **SQL Editor**:

```sql
create table public.shop_settings (
  key text primary key,
  value jsonb not null
);
alter table public.shop_settings enable row level security;
create policy "public read settings" on public.shop_settings
  for select using (true);
create policy "admin write settings" on public.shop_settings
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

insert into public.shop_settings (key, value) values
  ('pricing', '{"bySize": {"30": 1450, "50": 2150, "100": 3600}, "oilSurchargePerMl": 25}');

-- per-perfume prices; no row = perfume uses the builder size price
create table public.premade_prices (
  scent_id text primary key,
  prices jsonb not null
);
alter table public.premade_prices enable row level security;
create policy "public read premade prices" on public.premade_prices
  for select using (true);
create policy "admin write premade prices" on public.premade_prices
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));
```

## Product & hero photos (optional)

Each perfume card and hero slide shows a generative visual by default. In the
admin panel you can **upload a photo directly** (file picker) for any perfume and
for the three landing-page hero slides — the uploaded image then *replaces* the
generated bottle/wash. Uploads need the Storage bucket **and** the two tables
below; without them the app still runs and just shows the generative visuals.

The SQL below is **idempotent** — the `if not exists` / `on conflict` /
`drop policy if exists` guards mean you can paste the whole thing and re-run it
safely even if you already created `premade_images` in an earlier setup.

### 1. Storage bucket + policies

The bucket must be **public** so saved public URLs render without signed access.
You can create it from **Storage → Create bucket** (name it exactly
`product-images`, tick **Public bucket**) or just let the first line below do it.
Run in **SQL Editor**:

```sql
-- Create the public bucket if it isn't there yet
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read of every object in the bucket
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admins may upload / replace / delete
drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );
```

### 2. Image-URL tables

Perfume photos are keyed by `scent_id`; hero photos by slot (`hero-1`, `hero-2`,
`hero-3`). Both store the uploaded file's public URL (or a pasted http(s) URL).
Run in **SQL Editor**:

```sql
create table if not exists public.premade_images (
  scent_id text primary key,
  url text not null
);
alter table public.premade_images enable row level security;
drop policy if exists "public read premade images" on public.premade_images;
create policy "public read premade images" on public.premade_images
  for select using (true);
drop policy if exists "admin write premade images" on public.premade_images;
create policy "admin write premade images" on public.premade_images
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create table if not exists public.hero_images (
  slot text primary key,
  url text not null
);
alter table public.hero_images enable row level security;
drop policy if exists "public read hero images" on public.hero_images;
create policy "public read hero images" on public.hero_images
  for select using (true);
drop policy if exists "admin write hero images" on public.hero_images;
create policy "admin write hero images" on public.hero_images
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));
```

## Updating an order's status

Orders start as `pending`. To update one after you've mixed/shipped it, run in SQL Editor:

```sql
update public.orders set status = 'shipped' where id = 'the-order-id';
```

Recognized statuses in the UI: `pending`, `mixing`, `shipped`, `delivered`, `cancelled`.
