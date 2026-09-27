-- Apply after 20260923_admin_auth.sql and 20260923_storage_buckets.sql.
-- Adds one site-wide settings row. Existing collections, photos and files are untouched.
begin;

create table if not exists public.site_settings (
    id text primary key check (id = 'home'),
    hero_src text,
    hero_srcset text,
    about_title_en text check (about_title_en is null or (char_length(btrim(about_title_en)) between 1 and 160)),
    about_description_en text check (about_description_en is null or (char_length(btrim(about_description_en)) between 1 and 3000)),
    about_title_zh text check (about_title_zh is null or (char_length(btrim(about_title_zh)) between 1 and 160)),
    about_description_zh text check (about_description_zh is null or (char_length(btrim(about_description_zh)) between 1 and 3000)),
    updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values ('home') on conflict (id) do nothing;

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;

create policy "Public reads site settings"
on public.site_settings for select to anon, authenticated using (true);
create policy "Portfolio admins update site settings"
on public.site_settings for update to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

-- Published names are immutable and versioned; existing uploads are never overwritten.
create policy "Portfolio admin uploads Hero exports"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'portfolio-web'
    and (select public.is_portfolio_admin())
    and name ~ '^hero/home/[a-z0-9-]+/(640|1200|1800)\.webp$'
);

commit;
