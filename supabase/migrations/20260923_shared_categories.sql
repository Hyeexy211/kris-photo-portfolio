-- Apply after 20260923_admin_auth.sql and 20260923_collection_content.sql.
-- Back up collections and photos first. This migration does not delete content.

begin;

create table public.categories (
    id text primary key,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint categories_id_not_blank check (btrim(id) <> ''),
    constraint categories_name_not_blank check (btrim(name) <> '')
);

-- Keep the exact existing category keys. Even if a Collection and Photo use
-- different names, both remain represented and no photograph is reclassified.
insert into public.categories (id, name)
select category, category
from (
    select category from public.collections
    union
    select category from public.photos
) as existing_categories
where category is not null and btrim(category) <> '';

create unique index categories_name_ci_unique
    on public.categories (lower(btrim(name)));

-- An empty category means "not assigned". NULL allows the existing columns
-- to reference one shared definition without inventing a placeholder value.
alter table public.collections alter column category drop not null;
alter table public.collections alter column category drop default;
alter table public.photos alter column category drop not null;
alter table public.photos alter column category drop default;

update public.collections set category = null where btrim(category) = '';
update public.photos set category = null where btrim(category) = '';

alter table public.collections
    add constraint collections_category_fkey foreign key (category)
    references public.categories(id) on update cascade on delete restrict;
alter table public.photos
    add constraint photos_category_fkey foreign key (category)
    references public.categories(id) on update cascade on delete restrict;

alter table public.categories enable row level security;
revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

create policy "Public can read categories"
on public.categories for select to anon, authenticated
using (true);

create policy "Portfolio admins can insert categories"
on public.categories for insert to authenticated
with check ((select public.is_portfolio_admin()));

create policy "Portfolio admins can update categories"
on public.categories for update to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

create policy "Portfolio admins can delete categories"
on public.categories for delete to authenticated
using ((select public.is_portfolio_admin()));

-- Supabase RPC calls run in one PostgreSQL transaction. A failed update or
-- deletion rolls the entire merge back, including both content tables.
create function public.merge_categories(source_id text, target_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    moved_collections integer;
    moved_photos integer;
begin
    if not public.is_portfolio_admin() then
        raise exception 'Portfolio admin access required' using errcode = '42501';
    end if;
    if source_id is null or target_id is null or source_id = target_id then
        raise exception 'Choose two different categories' using errcode = '22023';
    end if;

    -- Lock in a consistent order, then check that both IDs still exist.
    perform id from public.categories
    where id in (source_id, target_id)
    order by id for update;
    if not exists (select 1 from public.categories where id = source_id)
       or not exists (select 1 from public.categories where id = target_id) then
        raise exception 'A category no longer exists' using errcode = 'P0002';
    end if;

    update public.collections set category = target_id, updated_at = now()
    where category = source_id;
    get diagnostics moved_collections = row_count;

    update public.photos set category = target_id, updated_at = now()
    where category = source_id;
    get diagnostics moved_photos = row_count;

    delete from public.categories where id = source_id;

    return jsonb_build_object(
        'collectionsUpdated', moved_collections,
        'photosUpdated', moved_photos
    );
end;
$$;

revoke all on function public.merge_categories(text, text) from public, anon;
grant execute on function public.merge_categories(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
