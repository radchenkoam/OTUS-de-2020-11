create table if not exists public.clusters (
  id serial, -- идентификатор кластера
  "name" text not null default 'noname'::text, -- имя
  "type" text not null default 'notype'::text, -- тип
  url text null, -- url
  cnt int4 not null default 0, -- количество
  constraint clusters_pk primary key (id)
);