# Content backup and release monitoring (2026-09-23)

The repository contains the original nine-photo seed, but future Cloud Admin
edits happen in Supabase and will not be captured by Git. The read-only script
below exports the public `collections` and `photos` rows with the configured
publishable key; it cannot access Auth accounts, Storage originals, hidden
database data, or the database policy definitions.

## Make and check a content snapshot

1. Choose an existing external backup directory. Keep it outside this public
   website repository. Run:

   ```sh
   node scripts/export-public-content.js /path/to/external-backup-directory
   ```

2. The script writes a new `kris-public-content-<UTC time>.json` file with
   restrictive local permissions and never overwrites a file with the same
   name. Check the displayed row counts against the current Admin lists.
3. Open the JSON and confirm `format`, `exportedAt`, and the expected IDs.
   Store a second copy in a separate location chosen by the owner. A single
   computer or directory is not a full backup.
4. Export after each content editing session and before applying a migration.
   Periodically perform a restore exercise in a separate Supabase test project
   before relying on these snapshots for recovery.

The two tables are fetched in separate HTTP requests, so this JSON is not an
atomic database snapshot if someone edits content during export. Pause Admin
edits while exporting. Restoring rows, Auth users, Storage objects and policies
requires a database-level backup or a carefully reviewed migration; the script
does not perform a restore. An owner with dashboard access should configure and
test the Supabase project's native database and Storage backup options before
marking the production backup strategy complete.

## Release monitoring checklist

After a reviewed branch is merged to the Pages source (`main`), check the live
homepage, one Collection, a static photo page, its 1200px download, mobile
navigation, and browser console. Verify Supabase public reads, the latest
social metadata, and `sitemap.xml`. Record the Pages build status and whether
the checked commit matches the deployed `main` commit.

No external error-monitoring account or alert destination is configured. A
privacy-conscious monitoring service can be selected when the owner has a
contact destination and has decided which diagnostic data may leave the site.
Until then, local browser checks are release verification, not continuous
error monitoring.
