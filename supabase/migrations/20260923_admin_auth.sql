-- Run after schema.sql and seed.sql. Existing public reads remain available.
-- No user is granted write access until an Auth user is explicitly enrolled.

begin;

create table if not exists public.portfolio_admins (
    user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.portfolio_admins enable row level security;
revoke all on table public.portfolio_admins from anon, authenticated;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.portfolio_admins
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

alter table public.photos
    add column if not exists description text not null default '',
    add column if not exists tags text[] not null default '{}',
    add column if not exists camera text not null default '',
    add column if not exists lens text not null default '',
    add column if not exists focal_length text not null default '',
    add column if not exists aperture text not null default '',
    add column if not exists shutter_speed text not null default '',
    add column if not exists iso text not null default '';

-- Browser-local Admin already permits photographs without a Collection.
alter table public.photos alter column collection_id drop not null;

grant insert, update, delete on table public.collections to authenticated;
grant insert, update, delete on table public.photos to authenticated;

drop policy if exists "Portfolio admins can insert collections" on public.collections;
create policy "Portfolio admins can insert collections"
on public.collections for insert to authenticated
with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can update collections" on public.collections;
create policy "Portfolio admins can update collections"
on public.collections for update to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can delete collections" on public.collections;
create policy "Portfolio admins can delete collections"
on public.collections for delete to authenticated
using ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can insert photos" on public.photos;
create policy "Portfolio admins can insert photos"
on public.photos for insert to authenticated
with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can update photos" on public.photos;
create policy "Portfolio admins can update photos"
on public.photos for update to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can delete photos" on public.photos;
create policy "Portfolio admins can delete photos"
on public.photos for delete to authenticated
using ((select public.is_portfolio_admin()));

commit;
