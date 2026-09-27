-- Use only together with a code rollback, after making and checking a fresh
-- external backup of collections, photos, and categories.
-- This preserves content rows and converts category IDs to their current names.

begin;

drop function public.merge_categories(text, text);

alter table public.collections drop constraint collections_category_fkey;
alter table public.photos drop constraint photos_category_fkey;

update public.collections as collection
set category = category_name.name
from public.categories as category_name
where collection.category = category_name.id;

update public.photos as photo
set category = category_name.name
from public.categories as category_name
where photo.category = category_name.id;

update public.collections set category = '' where category is null;
update public.photos set category = '' where category is null;

alter table public.collections alter column category set default '';
alter table public.collections alter column category set not null;
alter table public.photos alter column category set default '';
alter table public.photos alter column category set not null;

drop table public.categories;

notify pgrst, 'reload schema';

commit;
