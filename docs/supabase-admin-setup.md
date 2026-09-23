# Authenticated Admin setup (manual database step)

The SQL migration in `supabase/migrations/20260923_admin_auth.sql` prepares
browser-authenticated writes without giving anonymous visitors write access.
It also adds optional public metadata columns. On 2026-09-23, live owner
sign-in and `is_portfolio_admin() = true` were verified, and the existing Auth
membership, function, and RLS configuration were inspected. The separate
`20260923_collection_content.sql` migration was then applied to the live
project. Its three new columns and `ON DELETE SET NULL` foreign key were
verified; the original three Collections and nine Photos retained all old
field values and timestamps. Post-migration owner CRUD and image upload were
then tested through the current source's HTTP preview against real Supabase.
Temporary rows and uploaded files were removed, and all original row values
and timestamps were verified unchanged. Anonymous database INSERT returned
42501 and Storage upload returned 403. A second signed-in non-admin account
has not been tested. Do not rerun setup SQL merely because it exists in this
repository; the steps below also apply when setting up another environment.

1. In the existing Supabase project, create or invite the owner's Auth user.
   Disable open signup if this project is owner-only. Do not put a password or
   service-role key in the repository.
2. In Supabase Dashboard, check that the `portfolio_admins` membership table,
   `is_portfolio_admin()` function, and owner-only RLS policies for
   `collections` and `photos` exist. If the migration is absent, review and
   run it in SQL Editor. If the live state differs from the checked-in SQL,
   reconcile it before relying on Cloud Admin writes.
   Also inspect `collections.story`, `photos.collection_order`,
   `photos.capture_time`, and the `photos.collection_id` foreign key. The
   earlier public API check reported missing fields; the live migration later
   on 2026-09-23 resolved those gaps. In another environment, review and apply
   `20260923_collection_content.sql` only after confirming the actual state.
   Verify that deleting a test Collection leaves its Photos intact with a
   null association.
3. In the Auth dashboard, copy the actual user UUID. Enroll that user from SQL
   Editor using `insert into public.portfolio_admins (user_id) values
   ('<ACTUAL_AUTH_USER_UUID>');` with the placeholder replaced.
4. Verify a visitor can still select public rows but cannot insert, update or
   delete. Verify a signed-in user who is not enrolled also cannot write.
5. Verify the enrolled owner can edit a test row and restore it. Test an
   authenticated session, sign-out, and a fresh browser before declaring the
   Admin stage complete.

Open `admin.html` for email/password sign-in and the cloud editor;
the previous `admin.html?mode=cloud` URL remains supported. Open
`admin.html?mode=local` explicitly for the browser-local prototype and its
seed reset. The cloud editor hides content before sign-in and never offers the
local seed reset. Its browser session persists with Supabase Auth and signs
out locally. Use the published HTTPS site or an HTTP local preview, not a
`file://` copy, for cloud administration. A static HTML URL can still be
requested by anyone; RLS is the actual protection for data. The frontend path
has passed local CRUD tests and unauthenticated browser checks. After the
content migration, real owner tests passed for new Collections and Photos,
story and capture-time edits (including clearing the time), cover/photo
replacement, category changes, membership, independent Collection ordering,
and deletion. Deleting a Collection retained its Photo with a null
association. Database and Storage test content was cleaned up afterward.
See `docs/crud-test-report-2026-09-23.md` for exact results; the non-admin
account and broader negative permission matrix remain open. This does not
claim the current source changes have been deployed to GitHub Pages.

Cloud Admin changes the database but cannot rewrite GitHub Pages HTML. After
editing the title, description, alt text or image of one of the nine seed
photos, run `node scripts/generate-photo-pages.js --source=supabase` in the
repository, inspect `git diff -- photos/`, synchronize `dist/photos/`, and
release those generated pages through the normal Git branch review. The script
uses only the configured public Supabase URL and publishable key. New cloud-only
photos still use the generic `photo.html?id=...` URL; publishing them as static
share pages requires a separate sitemap and link update. Do not claim social
previews are current before the generated pages are deployed and checked live.

Do not enroll an unverified UUID. The membership table is not exposed to
browser roles, and the `is_portfolio_admin()` function uses a fixed search
path and checks the caller's Supabase Auth UID. Client-side hiding of Admin
controls is only a user interface; database grants and RLS enforce access.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [JavaScript email/password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).
