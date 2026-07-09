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

## Updating an order's status

Orders start as `pending`. To update one after you've mixed/shipped it, run in SQL Editor:

```sql
update public.orders set status = 'shipped' where id = 'the-order-id';
```

Recognized statuses in the UI: `pending`, `mixing`, `shipped`, `delivered`, `cancelled`.
