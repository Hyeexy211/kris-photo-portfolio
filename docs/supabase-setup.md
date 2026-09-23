# Lesson 34: Supabase read-only setup

Lesson 34 adds a real cloud read path without removing the browser-local content path.
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

The current production configuration selects Supabase. If a cloud read fails,
`fallbackToLocal: true` lets the Content Service return the existing
localStorage/seed content instead. A new or offline checkout can explicitly set
`source: "local"` until its browser-safe Supabase configuration is ready.

## 1. Create the database tables and read policies

1. Create or open a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.

The schema uses text IDs because the current project already uses stable IDs
such as `portrait` and `portrait-001`. `photos.collection_id` is a foreign key
to `collections.id`.

The SQL enables Row Level Security, revokes all browser-role privileges, then
grants only `SELECT` to `anon` and `authenticated`. It creates no browser
`INSERT`, `UPDATE`, or `DELETE` grants or policies. The Admin page therefore
continues to edit localStorage only; authenticated cloud CRUD belongs to the
next lesson.

## 2. Add browser-safe project configuration

Open `js/config/data-source.js` and set:

```js
const CONTENT_DATA_SOURCE = Object.freeze({
    source: "supabase",
    fallbackToLocal: true,
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

The repository performs this mapping. Page scripts continue to receive the
existing camelCase objects and do not contain database queries.

## 4. Manual verification after dashboard setup

Serve `dist/` or the project root over HTTP, then verify:

1. The homepage shows three Collection cards and nine Gallery photographs.
2. Each Collection card shows the correct three-photo count.
3. `collection.html?slug=portrait` shows the matching collection and photos.
4. Gallery filters, Reveal animation, Lightbox navigation, and mobile layout work.
5. Browser Network requests to `/rest/v1/collections` and `/rest/v1/photos`
   return `200`.
6. An anonymous browser request cannot insert, update, or delete rows.
7. Temporarily using an invalid project URL causes the public pages to use the
   local fallback without crashing.

The current project completed these dashboard steps and passed live verification
on September 23, 2026: anonymous reads returned three collections and nine photos,
every photo referenced a returned collection, and anonymous insert, update, and
delete requests were denied. Repeat this checklist if the Supabase project or its
browser configuration changes.
