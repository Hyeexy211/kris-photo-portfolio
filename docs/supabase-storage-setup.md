# Supabase Storage setup and acceptance checks

The prepared migration is `supabase/migrations/20260923_storage_buckets.sql`.
This repository does not prove whether it has been applied to the live project.
Check the live Supabase project before running SQL. The migration provisions two
buckets when absent and owner-only Storage policies; it does not upload, move,
or remove any repository photographs.

## Apply in order

1. Complete `docs/supabase-admin-setup.md`: create the actual owner Auth user,
   apply `20260923_admin_auth.sql`, and enroll the verified user UUID.
2. Review the existing Storage buckets and policies in the Supabase Dashboard.
   A pre-existing policy on `storage.objects` may also apply to these buckets;
   remove or narrow any broad policy before relying on this migration.
3. In Storage, confirm whether `portfolio-web` and `portfolio-originals` already
   exist. If this migration has **not** been applied, review and run the whole
   `20260923_storage_buckets.sql` file in the SQL Editor. If the previous version
   **has** been applied, run only the new `Portfolio admin uploads collection
   covers` policy block from that file. Do not create a second image bucket.
   If either existing bucket conflicts with the checked-in settings, stop and
   review it rather than overwriting it.
4. Confirm `portfolio-web` is public with a 10 MiB per-file limit and WebP/AVIF
   MIME allowlist, while `portfolio-originals` is private and has no browser
   object policies. Confirm the authenticated owner has INSERT permission for
   both `photos/<id>/<revision>/<width>.webp` and
   `collections/<id>/<revision>/<width>.webp`, where `<width>` is 640, 1200, or
   1800. Anonymous and non-owner uploads must remain denied.
5. Use expendable test images for a staged upload and public page check before
   publishing real content. Leave all existing repository originals in place,
   as required by `docs/storage-architecture.md`.

## Cloud Admin image upload

After the owner account and both migrations pass the live permission checks,
open `admin.html?mode=cloud` and sign in. For a new Collection or Gallery
item, select a local JPEG, PNG, WebP, or browser-decodable AVIF image and
check its preview before saving. Editing an item allows a replacement file;
leaving the file chooser empty retains its current image. The source image
must be at least 1800 pixels wide, at most 25 MiB, and at most 40 megapixels.
Fill the real title, visible-image alt text, and category. Leave unknown date,
location, tags, and camera fields empty. The generated URLs and measured
1200px dimensions are written to the existing `collections.cover` /
`collections.cover_srcset` or `photos.src` / `photos.full_src` /
`photos.srcset` fields only after upload succeeds. No manual image URL is
needed in Cloud Admin.

The browser renders 640px, 1200px, and 1800px WebP exports and refuses an
export larger than 6 MiB. It checks each WebP RIFF file for EXIF and XMP chunks
before upload. The JPEG/PNG/WebP/AVIF source file is never uploaded. The code
uses immutable `photos/<photo-id>/<revision>/<width>.webp` or
`collections/<collection-id>/<revision>/<width>.webp` keys, `upsert: false`,
and a one-year cache duration. Progress counts completed uploaded web files;
the Supabase standard upload API used here does not provide byte progress or
an in-flight cancel button. The selected source stays on the owner's device
and must be archived separately if the owner wants a recoverable original.

The database row is inserted or updated after all three Storage uploads
succeed. A failed upload leaves the database unchanged. If saving the row
fails, the editor attempts to remove only this attempt's confirmed uploads
when a direct row check proves they are unreferenced. If the database response
is ambiguous or cleanup fails, the editor retains the files and reports their
paths for manual review rather than risking a broken published image. Old
image objects remain in Storage after a successful replacement. Do not
blindly delete reported keys; first check the relevant `collections` or
`photos` row and public URLs.

Deleting a Gallery item in Cloud Admin currently deletes only its database
row. It does not automatically remove public Storage objects. The confirmation
and success message make this visible. Review the bucket paths and backups
before removing uploaded web files manually; never delete a photographed
source file as part of this workflow.

The expanded Collection and Gallery create/edit flows still need live owner
verification. Before using them for real work, verify an owner upload and
public image load, anonymous/non-admin denial, duplicate-key rejection,
replacement without deleting the old image, and failure cleanup in the live
project. The existing nine photo pages remain on checked-in images. A new
cloud photo uses
`photo.html?id=...` and does not yet receive a static social card or a download
button. The current explicit download link accepts only checked-in 1200px
WebPs. A canvas export requests sRGB drawing, but embedded color profile and
appearance need a real browser/image review for each source type.

## Live checks with expendable test files

Use an owner account, a second signed-in account that is **not** in
`portfolio_admins`, and an anonymous browser. Use a new throwaway web path
like `photos/test-photo/review-1/640.webp`; delete only the test object after
checking it. Do not test destructive operations on published photos.

| Request | Owner | Other signed-in account | Anonymous |
| --- | --- | --- | --- |
| Upload a valid WebP under a versioned `photos/` or `collections/` path in `portfolio-web` | Succeeds | Denied | Denied |
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
