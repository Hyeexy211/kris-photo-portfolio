# Supabase Storage setup and acceptance checks

The prepared migration is `supabase/migrations/20260923_storage_buckets.sql`.
It has **not** been applied to the live project. It creates two empty buckets;
it does not upload, move, or remove any repository photographs.

## Apply in order

1. Complete `docs/supabase-admin-setup.md`: create the actual owner Auth user,
   apply `20260923_admin_auth.sql`, and enroll the verified user UUID.
2. Review the existing Storage buckets and policies in the Supabase Dashboard.
   A pre-existing policy on `storage.objects` may also apply to these buckets;
   remove or narrow any broad policy before relying on this migration.
3. Review and run `20260923_storage_buckets.sql` in the SQL Editor. If either
   bucket already exists with conflicting settings, the migration stops for
   manual review. Confirm `portfolio-web` is public with a 10 MiB per-file
   limit and WebP/AVIF MIME allowlist, while `portfolio-originals` is private
   and has no browser object policies.
4. Keep using checked-in image paths until an authenticated, staged web-export
   upload and page check succeed. Follow `docs/storage-architecture.md` before
   changing photo rows. Leave all existing originals in the repository as the
   owner requested.

## Live checks with expendable test files

Use an owner account, a second signed-in account that is **not** in
`portfolio_admins`, and an anonymous browser. Use a new throwaway web path
like `photos/test-photo/review-1/640.webp`; delete only the test object after
checking it. Do not test destructive operations on published photos.

| Request | Owner | Other signed-in account | Anonymous |
| --- | --- | --- | --- |
| Upload a valid WebP under the versioned `portfolio-web` path | Succeeds | Denied | Denied |
| Upload an invalid path, JPEG MIME, or file over 10 MiB to `portfolio-web` | Denied | Denied | Denied |
| Read the public web-export URL | Succeeds | Succeeds | Succeeds |
| List `portfolio-web` through the Storage API | Succeeds | Denied | Denied |
| Overwrite an existing web-export key | Denied | Denied | Denied |
| Delete the expendable web export | Succeeds | Denied | Denied |
| Upload an original to `portfolio-originals` | Denied | Denied | Denied |
| Download, list, or create a signed URL for a private original | Denied | Denied | Denied |
| Overwrite or delete a private original from a browser | Denied | Denied | Denied |

Actual originals remain outside Storage until the owner chooses an archive
and validates its format, size limits, billing, and restore process. The
private-object negative checks apply if a private object is later present;
the bucket is empty after this migration. A privileged Dashboard or
service-role operation can bypass these browser RLS policies; never put a
service-role key in website code. Never delete rows from `storage.objects`
with SQL.

References: [Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[Storage RLS](https://supabase.com/docs/guides/storage/security/access-control),
[operation-aware policy helper](https://supabase.com/docs/guides/storage/schema/helper-functions),
and [Storage schema guidance](https://supabase.com/docs/guides/storage/schema/design).
