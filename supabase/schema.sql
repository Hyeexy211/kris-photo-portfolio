-- Lesson 34: public, read-only content schema for Supabase.
-- Run this file in the Supabase SQL Editor before seed.sql.

create table if not exists public.collections (
    id text primary key,
    slug text not null unique,
    title text not null,
    description text not null default '',
    cover text not null,
    cover_srcset text not null default '',
    cover_alt text not null default '',
    cover_width integer,
    cover_height integer,
    year text not null default '',
    location text not null default '',
    category text not null default '',
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.photos (
    id text primary key,
    collection_id text not null references public.collections(id) on update cascade on delete restrict,
    title text not null default '',
    alt text not null,
    src text not null,
    full_src text not null,
    srcset text not null default '',
    category text not null default '',
    location text not null default '',
    shot_at date,
    sort_order integer not null default 0,
    width integer,
    height integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists photos_collection_id_idx on public.photos(collection_id);
create index if not exists photos_sort_order_idx on public.photos(sort_order);

alter table public.collections enable row level security;
alter table public.photos enable row level security;

-- Start from least privilege. Lesson 34 grants browser roles SELECT only.
revoke all on table public.collections from anon, authenticated;
revoke all on table public.photos from anon, authenticated;
grant select on table public.collections to anon, authenticated;
grant select on table public.photos to anon, authenticated;

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections"
on public.collections
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read photos" on public.photos;
create policy "Public can read photos"
on public.photos
for select
to anon, authenticated
using (true);

-- No INSERT, UPDATE or DELETE grants or policies are created for browser roles.
