create table if not exists public.vacancies (
  id integer not null,
  "name" text not null,
  "area" jsonb null,
  salary jsonb null,
  "type" jsonb null,
  experience jsonb null,
  schedule jsonb null,
  employment jsonb null,
  "description" text null, 
  key_skills text null,
  employer jsonb null,
  published_at timestamptz not null,
  created_at timestamptz not null default current_timestamp,
  constraint vacancies_pk primary key (id)
);