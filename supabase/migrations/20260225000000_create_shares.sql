create table if not exists shares (
  id text primary key,
  type text not null check (type in ('comment', 'paste', 'user', 'post')),
  result jsonb not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- index for lookups by id (already covered by primary key)
-- index for analytics by type
create index if not exists shares_type_idx on shares (type);
create index if not exists shares_created_at_idx on shares (created_at desc);
