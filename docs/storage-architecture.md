# Photograph storage decision (2026-09-23)

The nine published photographs already have responsive web exports in `images/`.
The owner chose to keep the JPEG originals and full-size WebPs in this
repository for now. Do not delete or move them as part of a storage migration.
No storage bucket, billing account, or image CDN has been configured for this
branch.

## Services considered

| Service | Fit for this project | Constraint before use |
| --- | --- | --- |
| [Supabase Storage](https://supabase.com/docs/guides/storage/buckets/fundamentals) | Reuses the existing Supabase project and Auth identity. Public web exports and private originals can be separate buckets. Supabase provides [CDN delivery](https://supabase.com/docs/guides/storage/cdn/fundamentals). | Bucket creation, Storage RLS, and a live owner-account test. On-demand [image resizing](https://supabase.com/docs/guides/storage/serving/image-transformations) currently requires a paid plan, so prepare web sizes locally first. |
| [Cloudflare R2](https://developers.cloudflare.com/r2/buckets/public-buckets/) | S3-compatible object storage; a custom domain can put public assets behind Cloudflare Cache. | Separate account, domain, upload credentials and a signed-upload service. The `r2.dev` URL is for development, not production cache delivery. [R2 pricing](https://developers.cloudflare.com/r2/pricing/) must be checked again before purchase. |
| [Amazon S3 with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-overview.html) | Mature private-origin and signed-delivery options. | Separate AWS account, IAM, CloudFront origin access control, billing and an upload-signing service. More moving parts than this nine-photo portfolio needs now. |

**Next integration choice:** use Supabase Storage when the owner enables the
cloud Admin account and approves a bucket configuration. This follows the
existing client and avoids introducing another service. It is a design choice,
not a claim that Storage is connected. Re-evaluate R2 or S3 if scale, costs,
or delivery requirements change.

## Object and access rules for implementation

- Public bucket `portfolio-web`: immutable, browser-readable exports only.
  Object keys follow `photos/<photo-id>/<revision>/<size>.<format>` with
  lower-case IDs and predictable size labels such as `640.webp`, `1200.webp`,
  and `1800.webp`. A new revision gets a new path so long-lived cache headers
  cannot show an old image after an edit.
- Private bucket `portfolio-originals`: source files only if the owner later
  chooses to upload them. Public pages must never receive its object keys,
  direct URLs, signed URLs, or credentials. Existing repository originals stay
  where they are until the owner selects and verifies an external archive.
  Because this GitHub repository is public, a future private bucket would not
  make the already committed JPEG and full-size WebP copies private.
- The authenticated browser may upload web exports only after the owner's
  membership is verified, and Storage policies must repeat that check. An
  `anon` request must fail for upload, overwrite, and delete. Browser code must
  contain only the publishable key, never a service-role or S3 secret.
- Store the public web URLs and measured dimensions in the existing photo row
  only after every required export has uploaded and returned a successful
  response. On partial failure, leave the current photo row and image paths
  unchanged. Do not delete older objects until the new page has been checked.
- For public immutable objects, set a long `Cache-Control` duration at upload
  and use versioned keys. For a replacement at the same key, cache invalidation
  would need explicit verification; versioning avoids that dependency.
- Keep GPS and unverified shooting metadata out of public rows and image
  exports. The read-only EXIF review script may identify GPS presence without
  exposing coordinates.

## Live acceptance checks

1. Create the two buckets and apply narrowly scoped Storage policies after
   the Auth enrollment and database migration in `supabase-admin-setup.md`.
2. Verify public web object GET works for an anonymous browser, while private
   original GET and anonymous write/delete return denial.
3. Upload one already published web export under a new revision, compare hash
   and dimensions, then update its database URLs. Check desktop, mobile,
   fallback, and cached reload before moving another file.
4. Test interrupted upload, duplicate key, incorrect MIME type, excessive
   file size, and a non-admin signed-in account. No failed operation may change
   the live photo row or delete existing assets.
5. Record bucket names, cache settings, a restore procedure, and the actual
   service costs. Only then mark Storage, CDN, and upload roadmap items done.

No bucket names here are presumed to exist in the live project. The checks
above are pending external configuration and a real authenticated test.
