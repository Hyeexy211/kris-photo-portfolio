# Shared photo categories: migration and rollback

`supabase/migrations/20260923_shared_categories.sql` creates one category table
for both `collections.category` and `photos.category`. It was applied to this
project's production database on 2026-09-23 after the audited 3/9 to 0/0 content
reset. The instructions below are for reviewing that result or setting up
another environment. Do not rerun it when the table already exists; publishing
this website does not apply database SQL to any other project.

## Before applying

1. Export and verify readable copies of all current `collections` and `photos`
   rows in a non-public directory. `scripts/export-public-content.js` can
   export those public rows. Keep the file outside this repository and its
   `dist/` copy. Record the current row IDs and category values.
2. Check that `public.is_portfolio_admin()`, owner-only write policies, and
   `collections.story`, `photos.collection_order`, and `photos.capture_time`
   already exist. The category migration depends on them.
3. In SQL Editor, review the current category values:

   ```sql
   select 'collections' as source, category, count(*)
   from public.collections group by category
   union all
   select 'photos', category, count(*)
   from public.photos group by category;
   ```

The migration copies each nonempty existing value as an ID and initial name.
It does not reclassify or delete a Collection or Photo. For example, if a
Collection says `coffeeshop` while its Photos say `portrait`, both categories
remain available for review. Empty strings become `NULL` (no category).

## Apply and verify

Run all of `supabase/migrations/20260923_shared_categories.sql` once. The file
uses one database transaction, so an error rolls back the whole migration.
It adds foreign keys to the existing category columns, public read access to
category definitions, owner-only writes, and the owner-only
`merge_categories(source_id, target_id)` RPC. A category ID remains stable when
its display name changes. This lets one rename appear everywhere that uses
that ID. The merge RPC moves both Collection and Photo references to the
target ID and removes the source category in one transaction. A referenced
category cannot be deleted directly.

Check the migration result in SQL Editor:

```sql
select id, name from public.categories order by name;
select count(*) from public.collections;
select count(*) from public.photos;
select count(*) from public.collections as c
where c.category is not null and not exists (
    select 1 from public.categories as x where x.id = c.category
);
select count(*) from public.photos as p
where p.category is not null and not exists (
    select 1 from public.categories as x where x.id = p.category
);
```

The final two counts must be zero, and the content row counts must match the
live counts immediately before this migration. For this project's reset, those
counts were 0 Collections and 0 Photos; the earlier 3/9 JSON archive is a
pre-deletion backup, not the immediate pre-migration state. In a signed-out
browser, category reads should work but
category creation, rename, merge, and deletion should fail. Verify an owner
can create an expendable category, rename it, assign it to an expendable
Collection and Photo, merge it into another expendable category, then delete
an unused category. Remove only the test rows and category afterward. Also
check a signed-in non-owner account when one is available.

The browser sends category names and IDs through the existing Supabase client.
The owner session and database RLS are the access boundary; the visible Admin
controls are not the security boundary. New public pages read categories from
Supabase. If that read fails, they do not display browser-local category seeds.

## Rollback

First make a **fresh** non-public backup of `collections`, `photos`, and
`categories`, then check that it can be read. Roll back the matching website
code at the same time. Run
`supabase/migrations/20260923_shared_categories_rollback.sql` in SQL Editor.
It converts each stored category ID to its current name, restores the old
non-null text columns, and removes the category table, policies, and merge RPC.
Collection and Photo rows remain in place. A category with no references has
no place in the old schema and will exist only in the backup. Do not use the
rollback file as a content-clearing operation.
