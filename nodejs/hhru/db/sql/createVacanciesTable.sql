create table if not exists public.vacancies (
  id integer not null,
  "name" text not null,
  "area" jsonb null,
  salary jsonb null,
  "type" jsonb null,
  employer jsonb null,
  snippet jsonb null,
  published_at timestamptz not null,
  created_at timestamptz not null default current_timestamp,
  constraint vacancies primary key (id)
);