create table if not exists shares (
  id text primary key,
  type text not null check (type in ('comment', 'paste', 'user', 'post')),
  result jsonb not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shares_type_idx on shares (type);
create index if not exists shares_created_at_idx on shares (created_at desc);

-- RLS: anyone can read, only service role can write
-- (API routes use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
--  so server-side inserts work fine)
alter table shares enable row level security;

create policy "public read"
  on shares for select
  using (true);

-- no insert/update/delete policy for anon/authenticated roles
-- only service_role (bypasses RLS) can write
