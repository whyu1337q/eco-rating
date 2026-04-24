create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  phone text not null unique check (phone ~ '^\+\d{10,15}$'),
  country_code text not null default 'RU',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists country_code text not null default 'RU';

create table if not exists public.recycling_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fraction text not null check (
    fraction in ('Пластик', 'Бумага', 'Металл', 'Стекло', 'Картон', 'Электроника', 'Другое')
  ),
  weight numeric(10, 1) not null check (weight > 0 and weight <= 10000),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists recycling_entries_user_id_idx
  on public.recycling_entries (user_id);

create index if not exists recycling_entries_created_at_idx
  on public.recycling_entries (created_at desc);

alter table public.profiles enable row level security;
alter table public.recycling_entries enable row level security;

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert profiles" on public.profiles;
create policy "Public insert profiles"
  on public.profiles
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public update profiles" on public.profiles;
create policy "Public update profiles"
  on public.profiles
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Public read entries" on public.recycling_entries;
create policy "Public read entries"
  on public.recycling_entries
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert entries" on public.recycling_entries;
create policy "Public insert entries"
  on public.recycling_entries
  for insert
  to anon, authenticated
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'recycling_entries'
  ) then
    alter publication supabase_realtime add table public.recycling_entries;
  end if;
end
$$;
