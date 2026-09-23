-- Run after 20260923_admin_auth.sql. Review the current database first;
-- this migration adds optional content fields and preserves every Photo row.

begin;

alter table public.collections
    add column if not exists story text not null default '';

alter table public.photos
    add column if not exists collection_order integer,
    add column if not exists capture_time time without time zone;

-- Existing global sort_order remains the Gallery order. Derive an initial,
-- independent order within each Collection without changing that global order.
with ranked_photos as (
    select id,
           row_number() over (
               partition by collection_id
               order by sort_order, created_at, id
           )::integer as initial_order
    from public.photos
    where collection_id is not null
)
update public.photos as photo
set collection_order = ranked_photos.initial_order
from ranked_photos
where photo.id = ranked_photos.id
  and photo.collection_order is null;

alter table public.photos alter column collection_id drop not null;

-- The baseline uses photos_collection_id_fkey. Find the same single-column
-- relationship by definition as well, in case an existing database renamed it.
do $$
declare
    existing_fk record;
begin
    for existing_fk in
        select constraint_row.conname
        from pg_constraint as constraint_row
        join pg_attribute as column_row
          on column_row.attrelid = constraint_row.conrelid
         and column_row.attname = 'collection_id'
        where constraint_row.conrelid = 'public.photos'::regclass
          and constraint_row.confrelid = 'public.collections'::regclass
          and constraint_row.contype = 'f'
          and constraint_row.conkey = array[column_row.attnum]::smallint[]
    loop
        execute format('alter table public.photos drop constraint %I', existing_fk.conname);
    end loop;
end;
$$;

alter table public.photos
    add constraint photos_collection_id_fkey
    foreign key (collection_id) references public.collections(id)
    on update cascade on delete set null;

create index if not exists photos_collection_order_idx
    on public.photos(collection_id, collection_order);

notify pgrst, 'reload schema';

commit;
