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

## 4. Auth settings

Email/password sign-in is enabled by default. For frictionless local testing, go to
**Authentication → Providers → Email** and turn off **Confirm email** — sign-ups then
work instantly without a confirmation mail. Turn it back on before going live.

## 5. Vercel

Add the same two variables in your Vercel project (**Settings → Environment Variables**),
then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

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

## Updating an order's status

Orders start as `pending`. To update one after you've mixed/shipped it, run in SQL Editor:

```sql
update public.orders set status = 'shipped' where id = 'the-order-id';
```

Recognized statuses in the UI: `pending`, `mixing`, `shipped`, `delivered`, `cancelled`.
