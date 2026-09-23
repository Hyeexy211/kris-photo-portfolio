# Supabase Storage setup and acceptance checks

The migration is `supabase/migrations/20260923_storage_buckets.sql`. Live SQL
inspection on 2026-09-23 confirmed that `portfolio-web` and
`portfolio-originals` already existed with the expected configuration, along
with all four owner-only Storage policies (metadata reads, Photo uploads,
Collection-cover uploads, and export deletion). Both buckets contained zero
objects at that inspection. No Storage migration was rerun. Subsequent owner
tests used the current source's HTTP preview against real Supabase: a
Collection cover and two Gallery photos were uploaded, the cover and a photo
were replaced, and the public views loaded the test content. The 1080 × 1920
portrait sources produced the expected sizes and real-width `srcset` values.
All 15 test exports, including old replacement versions, were then deleted;
the three test prefixes and the anonymous-test prefix were empty. A final
read-only SQL check confirmed zero Storage objects. Anonymous
Storage upload returned 403. A second signed-in non-admin account and the
remaining negative cases below have not been tested.

A browser `getBucket()` error is not sufficient evidence that a bucket is
missing: reading bucket metadata requires `storage.buckets` SELECT permission,
separately from object uploads and listing. Check the Dashboard or SQL metadata
before changing bucket configuration; the editor does not need bucket
administration privileges. The migration provisions missing buckets and
owner-only object policies without uploading, moving, or removing photographs.

## Verify an environment before applying setup

1. Follow `docs/supabase-admin-setup.md`: create the actual owner Auth user if absent,
   verify/apply `20260923_admin_auth.sql` and
   `20260923_collection_content.sql` as needed, and enroll the verified user UUID.
2. Review the existing Storage buckets and policies in the Supabase Dashboard.
   A pre-existing policy on `storage.objects` may also apply to these buckets;
   remove or narrow any broad policy before relying on this migration.
3. In Storage, confirm whether `portfolio-web` and `portfolio-originals` already
   exist. The live project was confirmed complete on 2026-09-23. In an
   environment where this migration has **not** been applied, review and run the whole
   `20260923_storage_buckets.sql` file in the SQL Editor. If the previous version
   **has** been applied, run only the new `Portfolio admin uploads collection
   covers` policy block from that file. Do not create a second image bucket.
   If either existing bucket conflicts with the checked-in settings, stop and
   review it rather than overwriting it.
4. Confirm `portfolio-web` is public with a 10 MiB per-file limit and WebP/AVIF
   MIME allowlist, while `portfolio-originals` is private and has no browser
   object policies. Confirm the authenticated owner has INSERT permission for
   both `photos/<id>/<revision>/<size>.webp` and
   `collections/<id>/<revision>/<size>.webp`, where `<size>` is 640, 1200, or
   1800. Anonymous and non-owner uploads must remain denied.
5. Use expendable test images for a staged upload and public page check before
   publishing real content. Leave all existing repository originals in place,
   as required by `docs/storage-architecture.md`.

## Cloud Admin image upload

After the owner account and required database/Storage migrations pass the live permission checks,
open the published HTTPS `admin.html` and sign in (`?mode=cloud` remains
supported; `?mode=local` does not upload). For a new Collection or Gallery
item, select a local JPEG, PNG, WebP, or browser-decodable AVIF image and
check its preview before saving. Editing an item allows a replacement file;
leaving the file chooser empty retains its current image. The source image
must have a longest edge of at least 1800 pixels, be at most 25 MiB, and have
at most 40 megapixels. Both portrait and landscape images are supported.
Fill the real title, visible-image alt text, and category. Leave unknown date,
location, tags, and camera fields empty. The generated URLs are written to `collections.cover` /
`collections.cover_srcset` or `photos.src` / `photos.full_src` /
`photos.srcset` only after upload succeeds. The measured width and height of
the 1200 size are saved to `collections.cover_width` / `cover_height` or
`photos.width` / `height`. No manual image URL is needed in Cloud Admin.

The browser renders WebP exports whose longest edges are 640px, 1200px, and
1800px, preserves the original proportions, and never enlarges the source.
For example, a 1080 × 1920 portrait produces 360 × 640, 675 × 1200, and
1013 × 1800 exports (rounded to whole pixels). The size labels in Storage
keys remain 640/1200/1800; `srcset` descriptors use the actual output widths
(360w, 675w, and 1013w in this example). `src` and Collection covers use the
1200 size, while `fullSrc` uses the 1800 size. An export larger than 6 MiB is
rejected. Before upload, the browser checks each WebP RIFF file for EXIF and
XMP chunks. The JPEG/PNG/WebP/AVIF source file is never uploaded. The code
uses immutable `photos/<photo-id>/<revision>/<size>.webp` or
`collections/<collection-id>/<revision>/<size>.webp` keys, `upsert: false`,
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

Owner create/edit uploads, public image load, replacement retaining the old
version, and explicit cleanup of temporary objects passed against the live
project on 2026-09-23. Anonymous upload was denied. The signed-in non-admin
checks, duplicate-key rejection, invalid path/MIME/size cases, and automatic
cleanup after an injected live failure still need separate verification;
local failure simulations do not establish those live results. The existing
nine photo pages remain on checked-in images. A new
cloud photo uses
`photo.html?id=...` and does not yet receive a static social card or a download
button. The current explicit download link accepts only checked-in 1200px
WebPs. A canvas export requests sRGB drawing, but embedded color profile and
appearance need a real browser/image review for each source type.

## Live checks with expendable test files

The table below specifies expected behavior, not a claim that every cell has
been tested. The recorded outcomes are in `docs/crud-test-report-2026-09-23.md`.
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
the originals bucket was confirmed empty on 2026-09-23. A privileged Dashboard or
service-role operation can bypass these browser RLS policies; never put a
service-role key in website code. Never delete rows from `storage.objects`
with SQL.

References: [Storage bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[bucket metadata permissions](https://supabase.com/docs/reference/javascript/v1/storage-getbucket),
[Storage RLS](https://supabase.com/docs/guides/storage/security/access-control),
[operation-aware policy helper](https://supabase.com/docs/guides/storage/schema/helper-functions),
and [Storage schema guidance](https://supabase.com/docs/guides/storage/schema/design).
