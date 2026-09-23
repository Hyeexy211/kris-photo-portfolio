-- Run after 20260923_admin_auth.sql and owner enrollment.
-- This creates empty buckets and Storage policies; it does not move any photos.
-- Storage objects must be uploaded and removed through the Storage API, not SQL.

begin;

-- Public delivery is restricted to small, versioned WebP/AVIF exports.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'portfolio-web',
    'portfolio-web',
    true,
    10485760,
    array['image/webp', 'image/avif']::text[]
)
on conflict (id) do nothing;

-- This bucket is deliberately private and has no browser object policies.
-- Source-file formats, size limits, and an external archive must be decided
-- before any originals are uploaded.
insert into storage.buckets (id, name, public)
values ('portfolio-originals', 'portfolio-originals', false)
on conflict (id) do nothing;

-- Never silently accept an existing bucket with a weaker access model.
do $$
begin
    if exists (
        select 1 from storage.buckets
        where id = 'portfolio-web'
          and (
              name is distinct from 'portfolio-web'
              or public is distinct from true
              or file_size_limit is distinct from 10485760
              or allowed_mime_types is distinct from array['image/webp', 'image/avif']::text[]
          )
    ) then
        raise exception 'Review the existing portfolio-web bucket configuration before applying this migration';
    end if;

    if exists (
        select 1 from storage.buckets
        where id = 'portfolio-originals'
          and (name is distinct from 'portfolio-originals' or public is distinct from false)
    ) then
        raise exception 'portfolio-originals must be a private bucket';
    end if;
end;
$$;

-- The public URL serves web exports without SELECT, but only an enrolled owner
-- may list objects through the Storage API or upload/delete them.
drop policy if exists "Portfolio admin reads web export metadata" on storage.objects;
create policy "Portfolio admin reads web export metadata"
on storage.objects for select to authenticated
using (bucket_id = 'portfolio-web' and (select public.is_portfolio_admin()));

drop policy if exists "Portfolio admin uploads web exports" on storage.objects;
create policy "Portfolio admin uploads web exports"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'portfolio-web'
    and (select public.is_portfolio_admin())
    and name ~ '^photos/[a-z0-9-]+/[a-z0-9-]+/(640|1200|1800)\.(webp|avif)$'
);

-- There is intentionally no UPDATE policy: a published key is never overwritten.
drop policy if exists "Portfolio admin deletes web exports" on storage.objects;
create policy "Portfolio admin deletes web exports"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-web' and (select public.is_portfolio_admin()));

commit;
