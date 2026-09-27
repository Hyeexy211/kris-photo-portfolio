# Lesson 34: Supabase read-only setup

Lesson 34 introduced the cloud read path. The browser-local editor remains an
explicit prototype, separate from published cloud content.
The public pages keep this dependency direction:

```text
UI scripts
    ↓
Content Service
    ↓
Supabase Repository
    ↓
Supabase Client
    ↓
Supabase Data API / PostgreSQL
```

The production configuration selects Supabase. A cloud read failure displays a
loading error; it never republishes stale browser-local records. A development
checkout can explicitly set `source: "local"` to test its browser-local content,
but those edits are not cloud publication.

## 1. Create the database tables and read policies

For a **new, empty** project:

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run `supabase/schema.sql`.
4. Review and apply the Admin, content, Storage, and shared category migrations
   in dependency order. See `docs/shared-categories-migration.md` for the
   category migration and rollback.

For the **existing** project, the Admin and content migrations were checked in
an earlier run. On 2026-09-23, an external content backup was read back, the
inventoried old IDs were deleted (3 Collections / 9 Photos to 0 / 0), and the
shared category migration was then applied to the production database. See
`docs/content-reset-audit-2026-09-23.md` for the exact IDs and backup hash.
Do not rerun any of these scripts only because they are in this repository;
inspect the actual schema and records before further changes.

There is no longer a photography seed script in this source. A fresh site
starts with zero Collections and Photos, and has zero categories after the
shared category migration; the owner creates content through Cloud Admin.

The schema uses text IDs. `photos.collection_id` is a foreign key to
`collections.id`. The content migration makes membership optional, and the
shared category migration adds one category definition referenced by both tables.

The SQL enables Row Level Security, revokes all browser-role privileges, then
grants only `SELECT` to `anon` and `authenticated`. It creates no browser
`INSERT`, `UPDATE`, or `DELETE` grants or policies at this initial stage. The
subsequent Admin migration adds owner-only writes after authentication.

## 2. Add browser-safe project configuration

Open `js/config/data-source.js` and set:

```js
const CONTENT_DATA_SOURCE = Object.freeze({
    source: "supabase",
    fallbackToLocal: false,
    supabase: Object.freeze({
        url: "https://YOUR_PROJECT_REF.supabase.co",
        publishableKey: "YOUR_PUBLISHABLE_KEY"
    })
});
```

Find both values in the Supabase dashboard's **Connect** dialog or
**Settings → API Keys**. This project has no Vite/npm build step, so a browser
configuration file is used instead of build-time environment variables. The
project URL and publishable key are designed to be visible in browser code;
RLS and database grants provide the security boundary.

Never place an `sb_secret_...` key, a legacy `service_role` key, a database
password, or any other private credential in this repository or in frontend
JavaScript.

## 3. Existing model to database mapping

| Frontend field | Database column |
| --- | --- |
| `collection.order` | `collections.sort_order` |
| `collection.coverSrcset` | `collections.cover_srcset` |
| `collection.coverAlt` | `collections.cover_alt` |
| `photo.collectionId` | `photos.collection_id` |
| `photo.fullSrc` | `photos.full_src` |
| `photo.date` | `photos.shot_at` |
| `collection.category` / `photo.category` | Shared `categories.id` after migration |

The repository performs this mapping. Page scripts continue to receive the
existing camelCase objects and do not contain database queries.

## 4. Manual verification after dashboard setup

Serve `dist/` or the project root over HTTP, then verify:

1. With an empty database, Work and Gallery show their empty states; old photo
   URLs and browser cache do not revive old content.
2. After owner-created content, Collection cards, Gallery category filters,
   Lightbox navigation, and mobile layout work.
3. Browser Network requests to `/rest/v1/collections`, `/rest/v1/photos`, and
   `/rest/v1/categories`
   return `200`.
4. An anonymous browser request cannot insert, update, or delete rows.
5. Temporarily using an invalid project URL shows a loading error and no cached
   old photographs.

An earlier September 23, 2026 verification observed three Collections and nine
Photos. The later audited deletion returned zero of each immediately afterward,
and the shared category migration was applied. Temporary QA data may be present
while current browser checks run; record fresh counts after its cleanup. Repeat
this checklist after the current source is deployed.
