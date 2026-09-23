# Authenticated Admin setup (manual database step)

The SQL migration in `supabase/migrations/20260923_admin_auth.sql` prepares
browser-authenticated writes without giving anonymous visitors write access.
It also adds optional public metadata columns. This repository does not prove
whether it has been run on the live Supabase project; inspect the live project
before running it again.

1. In the existing Supabase project, create or invite the owner's Auth user.
   Disable open signup if this project is owner-only. Do not put a password or
   service-role key in the repository.
2. In Supabase Dashboard, check that the `portfolio_admins` membership table,
   `is_portfolio_admin()` function, and owner-only RLS policies for
   `collections` and `photos` exist. If the migration is absent, review and
   run it in SQL Editor. If the live state differs from the checked-in SQL,
   reconcile it before relying on Cloud Admin writes.
3. In the Auth dashboard, copy the actual user UUID. Enroll that user from SQL
   Editor using `insert into public.portfolio_admins (user_id) values
   ('<ACTUAL_AUTH_USER_UUID>');` with the placeholder replaced.
4. Verify a visitor can still select public rows but cannot insert, update or
   delete. Verify a signed-in user who is not enrolled also cannot write.
5. Verify the enrolled owner can edit a test row and restore it. Test an
   authenticated session, sign-out, and a fresh browser before declaring the
   Admin stage complete.

The existing `admin.html` remains the browser-local prototype. Open
`admin.html?mode=cloud` for the prepared email/password sign-in and cloud
editor. The cloud editor hides content before sign-in and never offers the
local seed reset. Its browser session persists with Supabase Auth and signs
out locally. A static HTML URL can still be requested by anyone; RLS is the
actual protection for data. The frontend path has passed local mock CRUD tests
and unauthenticated browser checks, but live authenticated CRUD is pending the
steps above.

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
