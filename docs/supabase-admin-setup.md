# Authenticated Admin setup (manual database step)

The SQL migration in `supabase/migrations/20260923_admin_auth.sql` prepares
browser-authenticated writes without giving anonymous visitors write access.
It also adds optional public metadata columns. It has **not** been run on the
live Supabase project in this branch.

1. In the existing Supabase project, create or invite the owner's Auth user.
   Disable open signup if this project is owner-only. Do not put a password or
   service-role key in the repository.
2. Run the migration in Supabase SQL Editor. Review the SQL before running it;
   it adds a `portfolio_admins` membership table, a membership function, and
   RLS policies for `collections` and `photos`.
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

Do not enroll an unverified UUID. The membership table is not exposed to
browser roles, and the `is_portfolio_admin()` function uses a fixed search
path and checks the caller's Supabase Auth UID. Client-side hiding of Admin
controls is only a user interface; database grants and RLS enforce access.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [JavaScript email/password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).
