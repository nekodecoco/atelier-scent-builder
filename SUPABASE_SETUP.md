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

This block is safe to re-run on an existing database — `if not exists` skips the
table, enabling RLS twice is a no-op, and each policy is dropped before it is
recreated. (Without those guards, `create table` on an existing `orders` fails
with `42P07` and Postgres aborts the whole script, so the RLS statements below it
would silently never run.)

```sql
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  created_at timestamptz not null default now(),
  status text not null default 'pending',
  total numeric not null,
  currency text not null default 'PHP',
  items jsonb not null
);

alter table public.orders enable row level security;

drop policy if exists "read own orders" on public.orders;
create policy "read own orders" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "insert own orders" on public.orders;
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
> block above — it is idempotent, so it will fix the policies without touching your data.

## 4. Auth settings

Email/password sign-in is enabled by default. For frictionless local testing, go to
**Authentication → Providers → Email** and turn off **Confirm email** — sign-ups then
work instantly without a confirmation mail. Turn it back on before going live.

## 5. Vercel

Add the same two variables in your Vercel project (**Settings → Environment Variables**),
then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The serverless functions need a few more (see [Order emails](#order-emails) below). Only
`VITE_`-prefixed variables reach the browser — the rest stay server-side:

| Variable | Used by | Required |
| --- | --- | --- |
| `GEMINI_API_KEY` | `api/curate.ts` | for the concierge |
| `RESEND_API_KEY` | `api/order-notify.ts` | for order emails |
| `SUPABASE_URL` | `api/order-notify.ts` | for order emails |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/order-notify.ts` | for order emails |
| `ORDER_FROM_EMAIL` | `api/order-notify.ts` | optional |
| `OWNER_EMAIL` | `api/order-notify.ts` | optional |

> **`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS completely.** Copy it from
> **Project Settings → API → service_role**. Never give it a `VITE_` prefix and never
> import it from `src/` — either would ship a full database bypass to every visitor.
> It is only ever read inside `api/order-notify.ts`.

## 6. Cross-device cart & saved blends

These power the synced cart (a signed-in customer's cart follows them across devices)
and saved favorite blends. Run in **SQL Editor**:

This block is safe to re-run — see the note on the orders table above.

```sql
-- one cart per user, mirrored across devices (guests keep a localStorage cart)
create table if not exists public.carts (
  user_id uuid primary key references auth.users,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;
drop policy if exists "own cart" on public.carts;
create policy "own cart" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- a customer's saved builder formulas ("favorite blends")
create table if not exists public.saved_blends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  name text not null,
  formula jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.saved_blends enable row level security;
drop policy if exists "read own saved blends" on public.saved_blends;
create policy "read own saved blends" on public.saved_blends
  for select using (auth.uid() = user_id);
drop policy if exists "insert own saved blends" on public.saved_blends;
create policy "insert own saved blends" on public.saved_blends
  for insert with check (auth.uid() = user_id);
drop policy if exists "delete own saved blends" on public.saved_blends;
create policy "delete own saved blends" on public.saved_blends
  for delete using (auth.uid() = user_id);
```

Both tables degrade gracefully — without them (or without Supabase) the app falls back to
the local cart and hides the saved-blends UI.

## Admin panel (stock, ingredients, orders)

The `/admin` page needs three more tables and an extra column. Run this in **SQL Editor**:

This block is safe to re-run — see the note on the orders table above. That matters most
here: a bare `alter table … add column` or `create policy` aborts on the second run, and
because Postgres aborts the *whole* script, every statement below it silently never runs.
The failure mode is an "admin" who cannot read orders, with no error they would notice.

```sql
-- who is allowed to administer the shop
create table if not exists public.admins (
  user_id uuid primary key references auth.users
);
alter table public.admins enable row level security;
drop policy if exists "read own admin flag" on public.admins;
create policy "read own admin flag" on public.admins
  for select using (auth.uid() = user_id);

-- stock for premade scents (no row = treated as in stock)
create table if not exists public.premade_stock (
  scent_id text primary key,
  stock integer not null default 0
);
alter table public.premade_stock enable row level security;
drop policy if exists "public read stock" on public.premade_stock;
create policy "public read stock" on public.premade_stock
  for select using (true);
drop policy if exists "admin write stock" on public.premade_stock;
create policy "admin write stock" on public.premade_stock
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- which builder ingredients are available (no row = available)
create table if not exists public.ingredient_availability (
  ingredient_id text primary key,
  available boolean not null default true
);
alter table public.ingredient_availability enable row level security;
drop policy if exists "public read availability" on public.ingredient_availability;
create policy "public read availability" on public.ingredient_availability
  for select using (true);
drop policy if exists "admin write availability" on public.ingredient_availability;
create policy "admin write availability" on public.ingredient_availability
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- orders: capture customer email + let admins see and update everything
alter table public.orders add column if not exists email text;
drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders" on public.orders
  for select using (exists (select 1 from public.admins where user_id = auth.uid()));
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- make yourself the admin (must have signed up in the app first)
insert into public.admins (user_id)
  select id from auth.users where email = 'nikko.alferez@gmail.com'
on conflict (user_id) do nothing;
```

After running it, sign in with that account and an **ADMIN** link appears in the header.

## Custom notes and perfumes

Lets the admin add their own builder ingredients and premade perfumes, and hide
built-in house blends. Run in **SQL Editor**:

This block is safe to re-run — see the note on the orders table above.

```sql
-- admin-created builder ingredients
create table if not exists public.custom_ingredients (
  id uuid primary key default gen_random_uuid(),
  note text not null check (note in ('top','heart','base')),
  name text not null,
  description text not null default '',
  color text not null default '#c9a53a',
  scent_twins jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.custom_ingredients enable row level security;
drop policy if exists "public read custom ingredients" on public.custom_ingredients;
create policy "public read custom ingredients" on public.custom_ingredients
  for select using (true);
drop policy if exists "admin write custom ingredients" on public.custom_ingredients;
create policy "admin write custom ingredients" on public.custom_ingredients
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- admin-created premade perfumes
create table if not exists public.custom_premades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null default '',
  description text not null default '',
  formula jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.custom_premades enable row level security;
drop policy if exists "public read custom premades" on public.custom_premades;
create policy "public read custom premades" on public.custom_premades
  for select using (true);
drop policy if exists "admin write custom premades" on public.custom_premades;
create policy "admin write custom premades" on public.custom_premades
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

-- built-in house blends can now be hidden from the collection
alter table public.premade_stock add column if not exists hidden boolean not null default false;
```

## Editable pricing

Lets the admin set builder prices per bottle size (plus the oil surcharge) and
give each premade its own price. Run in **SQL Editor**:

This block is safe to re-run — see the note on the orders table above. The seed row uses
`on conflict do nothing`, so re-running it will not overwrite prices you have since edited
in `/admin`.

```sql
create table if not exists public.shop_settings (
  key text primary key,
  value jsonb not null
);
alter table public.shop_settings enable row level security;
drop policy if exists "public read settings" on public.shop_settings;
create policy "public read settings" on public.shop_settings
  for select using (true);
drop policy if exists "admin write settings" on public.shop_settings;
create policy "admin write settings" on public.shop_settings
  for all
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

insert into public.shop_settings (key, value) values
  ('pricing', '{"bySize": {"30": 1450, "50": 2150, "100": 3600}, "oilSurchargePerMl": 25}')
on conflict (key) do nothing;

-- per-perfume prices; no row = perfume uses the builder size price
create table if not exists public.premade_prices (
  scent_id text primary key,
  prices jsonb not null
);
alter table public.premade_prices enable row level security;
drop policy if exists "public read premade prices" on public.premade_prices;
create policy "public read premade prices" on public.premade_prices
  for select using (true);
drop policy if exists "admin write premade prices" on public.premade_prices;
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

## Shipping addresses & profiles

Without this, an order arrives with an email address and nothing to ship to. Run in
**SQL Editor** — safe to re-run.

```sql
-- The address the order actually ships to, captured at checkout.
--
-- One jsonb column rather than eight flat ones: it is written once and only ever
-- rendered — never filtered on — and one column keeps a single shared shape across
-- orders.shipping, profiles.address, the checkout form, and the notification email.
-- Shape: { recipient, phone, line1, line2, barangay, city, province, postcode, landmark }
alter table public.orders add column if not exists shipping jsonb;

-- Stamped once by api/order-notify.ts so a retry or a double-click can't email twice.
-- Only the service-role key ever writes it.
alter table public.orders add column if not exists notified_at timestamptz;

-- A customer's reusable default address: prefills checkout, editable on /account.
--
-- NOTE: deliberately NOT the "public read / admin write" template the catalog tables
-- use. This is customer PII, not shop data, so it follows the carts/saved_blends
-- own-row template instead. Admins get no policy here and must not be given one:
-- every order already carries its own address snapshot, which is what actually
-- ships (this profile may have drifted since). Granting admins read here would
-- expose every customer's home address forever — including customers who never
-- ordered — for zero operational gain.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  address jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Stock decrement (automatic)

Before this, `premade_stock` was a number you typed that nothing ever changed — it drifted
from reality on the first order, and two customers could both buy the last bottle. These
triggers make it real. Run in **SQL Editor** — safe to re-run.

```sql
-- Decrement premade stock in the same transaction as the order insert.
--
-- security definer is required: premade_stock is admin-write under RLS and the
-- customer placing the order is not an admin. search_path is pinned because a
-- definer function without it is a privilege-escalation hole.
create or replace function public.apply_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  line jsonb;
  sid  text;
  want integer;
begin
  for line in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb))
  loop
    -- only premades are stocked; custom blends are mixed to order
    if line->>'kind' is distinct from 'premade' then continue; end if;

    sid := line->>'scentId';
    if sid is null or sid = '' then continue; end if;

    want := greatest(1, coalesce((line->>'qty')::int, 1));

    -- A single statement, so it is atomic: the row lock is held to the end of the
    -- transaction, which means two concurrent orders for the last bottle serialize
    -- and the loser re-checks `stock >= want` against the committed value.
    update public.premade_stock
       set stock = stock - want
     where scent_id = sid
       and stock >= want;

    if not found then
      -- No row at all = untracked = unlimited (the "no row = default" rule the app
      -- follows in useCatalogStore.isInStock). Only a row that exists and is short
      -- rejects the order — clamping at 0 would accept an order for bottles that
      -- don't exist, which is exactly the drift this is meant to fix.
      if exists (select 1 from public.premade_stock where scent_id = sid) then
        raise exception 'Sorry — % is out of stock. Please remove it from your cart.',
          coalesce(line->>'name', sid)
          using errcode = 'check_violation';
      end if;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists orders_apply_stock on public.orders;
create trigger orders_apply_stock
  before insert on public.orders
  for each row execute function public.apply_order_stock();

-- Cancelling an order returns its bottles to stock. Without this the status
-- dropdown in /admin silently corrupts stock on every cancellation.
create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  line jsonb;
  sid  text;
  want integer;
begin
  -- only on the transition INTO cancelled: re-saving an already-cancelled order
  -- must not restock a second time
  if new.status is distinct from 'cancelled' then return new; end if;
  if old.status is not distinct from 'cancelled' then return new; end if;

  for line in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb))
  loop
    if line->>'kind' is distinct from 'premade' then continue; end if;
    sid := line->>'scentId';
    if sid is null or sid = '' then continue; end if;
    want := greatest(1, coalesce((line->>'qty')::int, 1));

    -- only restock tracked scents (no row = untracked)
    update public.premade_stock
       set stock = stock + want
     where scent_id = sid;
  end loop;

  return new;
end;
$$;

drop trigger if exists orders_restock_cancelled on public.orders;
create trigger orders_restock_cancelled
  after update on public.orders
  for each row execute function public.restock_cancelled_order();
```

Verify both triggers exist:

```sql
select tgname from pg_trigger
where tgrelid = 'public.orders'::regclass and not tgisinternal;
-- expect orders_apply_stock and orders_restock_cancelled
```

Only lines carrying a `scentId` are tracked, so a cart persisted before that field existed
(or any custom blend) passes through untouched.

## Order emails

`api/order-notify.ts` emails the customer a confirmation and you a new-order alert, so you
stop having to poll `/admin` to discover sales. The checkout page calls it fire-and-forget
after the order commits — an email failure can never lose an order.

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Add `RESEND_API_KEY`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel
   (see the table in §5), then redeploy.

> **Until you verify a domain, customer confirmations go nowhere.** Resend's default
> sender (`onboarding@resend.dev`) only delivers to the address that owns the Resend
> account. So your **owner alert works immediately**, but the **customer's confirmation is
> silently dropped** — this is a Resend restriction, not a bug in the app.
>
> To turn customer email on: add a domain in Resend, add the DNS records it gives you, wait
> for it to verify, then set `ORDER_FROM_EMAIL` to something like
> `Atelier N°9 <orders@yourdomain.com>` and redeploy. Nothing else changes.

`OWNER_EMAIL` sets where the alert goes (defaults to `nikko.alferez@gmail.com`).

The endpoint takes only an order id and re-reads that order with the service-role key, so
it never trusts the request body for a recipient or an address. `orders.notified_at` is
stamped on success, so a retry or a double-click can't send twice.

The Vite dev server does not serve `api/`, so `/api/order-notify` 404s under `npm run dev`
and checkout simply sends no mail. Use `vercel dev` or a preview deploy to exercise it.

## Updating an order's status

Orders start as `pending`. `/admin` has a dropdown on every order, but you can also run:

```sql
update public.orders set status = 'shipped' where id = 'the-order-id';
```

Recognized statuses in the UI: `pending`, `mixing`, `shipped`, `delivered`, `cancelled`.
Setting `cancelled` returns that order's bottles to stock (see above).
