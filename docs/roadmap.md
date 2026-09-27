# Photography Portfolio Roadmap

This roadmap defines the development path for the photography portfolio.

The goal is to build the project gradually:

```text
Foundation
    ↓
Portfolio and Viewing Experience
    ↓
First Static Release
    ↓
Image Performance
    ↓
Optional Platform Features
    ↓
Long-term Platform
```

Avoid implementing later-stage infrastructure before the current stage is stable.
The first GitHub Pages release belongs to the current static-site stage; the later
backend and storage phases are optional expansion, not release prerequisites.

Checkboxes in older phases record the work verified **at that time**. The
previously merged `main` static files were checked on GitHub Pages; the current
zero-content and Work Admin changes have also received separate database and
deployment checks, with remaining negative-path limits listed below.

---

# Current Project Status (2026-09-27)

## Implemented in current repository source

- Native HTML/CSS/JavaScript responsive pages, generic Collection and Photo
  routes, data-driven Work and Gallery, Reveal, Lightbox, and responsive WebPs
- Empty browser-local default Collections and Photos, a targeted old-ID cache
  cleanup, and no public fallback to stale localStorage when Supabase fails
- Default authenticated Cloud Admin with the Work / Collection section as the
  photo editor: shared category controls, multiple file selection, per-photo
  review and retry, membership/order/category batch actions, and batch deletion
- Shared-category SQL migration and rollback files, with Repository and Content
  Service support; the SQL has been applied to this project's production database
- Old static Collection and Photo pages removed from source; the sitemap lists
  only the homepage, while existing image files remain in place

## Verified in this reset

- A non-public JSON export was read back with 3 Collections and 9 Photos;
  its path, SHA-256, record IDs, and image references are documented in
  `docs/content-reset-audit-2026-09-23.md`.
- The production database deleted only the inventoried old IDs, then returned
  0 Collections and 0 Photos. The shared-category migration was applied after
  that reset. Real owner QA then passed multi-photo, shared-category, batch,
  move, order, and public display flows. Its 2 Collections, 2 Photos, 1 Category,
  12 WebPs, and 4 automatic empty-folder objects were removed. Immediately after
  cleanup, the three content tables and two Storage buckets all counted 0.
- On 2026-09-27, public read-only data returned 0 Collections, 0 Photos, and
  4 later-added Categories. These were not on the audited deletion list and
  have been retained.
- Source commit `2035280` was pushed to `main`; GitHub Pages built that exact
  commit. Desktop English and mobile Chinese public pages, empty filters,
  legacy 404 routes, generic not-found views, and anonymous Admin gating passed
  online without page, console, or same-origin resource errors. The ignored
  `dist/` preview copy matched the root source in bytewise checks.
- On 2026-09-27, the current `320b372` source and live site received another
  read-only public/anonymous check. Isolated browser-local CRUD, batch editing,
  Gallery, Lightbox, language, mobile, image-export, and cloud-read failure
  checks passed. The exact scope and untested owner cloud paths are recorded in
  `docs/functionality-test-report-2026-09-27.md`.

## Verified in an earlier release or test

- The then-current `main` was released on GitHub Pages. That check does not
  establish that the current source or `dist/` is deployed.
- On 2026-09-23, the owner login, content-field migration, two Storage buckets,
  owner policies, single-photo/cover upload and replacement, and several CRUD
  paths were verified against real Supabase. The old 3 Collection / 9 Photo
  baseline was preserved after those tests and 15 test web exports were removed.
- Anonymous database INSERT and Storage upload were denied then. A second
  signed-in non-admin account was not tested.

## In Progress

- Finish negative permission checks with a second signed-in non-admin account
  and a real partial-failure cleanup test; mock retries and ambiguous responses
  are verified locally

## Next

- Add real owner content through Work Admin when photos and verified metadata
  are ready; generate a content-aware sitemap if individual entries later need
  search indexing
- Complete remaining non-admin, invalid-upload, and live failure-cleanup checks

## Deferred

- Original-file removal and unverified date, location, or equipment metadata
- Original-file archive, production CDN, monitoring, custom domain, and a full
  database/image restore process
- Analytics and long-term platform ideas until the owner chooses their scope

`Weblesson.docx` is outside this roadmap execution at the owner's request.

---

# Phase 1: Foundation

Goal:

Create a clean and maintainable frontend foundation.

## Structure

- [x] Create project repository
- [x] Create HTML structure
- [x] Create CSS file
- [x] Create JavaScript file
- [x] Create navigation
- [x] Create hero section
- [x] Organize project directories
- [x] Add README.md
- [x] Add AGENTS.md
- [x] Add roadmap.md
- [x] Improve `.gitignore`

## Responsive Design

- [x] Desktop layout
- [x] Tablet layout
- [x] Mobile layout
- [x] Responsive navigation
- [x] Responsive typography
- [x] Responsive image sizing

## Foundation Quality

- [x] Check semantic HTML
- [x] Remove temporary test code
- [x] Remove duplicated CSS
- [x] Establish CSS variables
- [x] Check basic accessibility
- [x] Check browser console

### Phase 1 Definition of Done

The site should:

- load reliably
- work on desktop and mobile
- have a clean code structure
- contain no major console errors

---

# Phase 2: Photography Portfolio

Goal:

Turn the basic website into an actual photography portfolio.

## Categories

Create initial categories:

- [x] Portrait
- [x] Documentary
- [x] Landscape
- [ ] Decide whether Street or Cafe needs a separate category later

## Gallery

- [x] Create gallery layout
- [x] Create reusable gallery items
- [x] Add responsive photo layouts
- [x] Display portrait and landscape photographs in the gallery
- [x] Give Portrait, Documentary, and Landscape their own static URLs
- [x] Link full-size project cards on the homepage to those pages
- [x] Add image captions

## Navigation

- [x] Connect Work navigation to the project cards
- [x] Add active category state
- [x] Add smooth anchor scrolling, with reduced-motion support

### Phase 2 Definition of Done

Visitors should be able to:

```text
Open website
    ↓
Choose a project card
    ↓
Open its page and browse photographs
```

---

# Phase 3: Photography Viewing Experience

Goal:

Make viewing individual photographs immersive.

## Lightbox

- [x] Click photograph to open
- [x] Full-screen viewer
- [x] Close button and Escape to close
- [x] Previous photograph
- [x] Next photograph
- [x] Keyboard navigation between photographs
- [x] Mobile swipe support

## Photo Information

- [x] Photo title
- [ ] Location
- [ ] Shooting date
- [ ] Camera
- [ ] Lens
- [ ] Focal length
- [ ] Aperture
- [ ] Shutter speed
- [ ] ISO

Metadata should only be displayed when useful. In the earlier nine-photo
release, those photos had no owner-confirmed optional values; their public
values intentionally stayed blank. New records should likewise leave unknown
fields blank.

The interface should remain visually minimal.

## URL Support

Future possibility:

```text
/photos/tokyo-night-001
```

- [x] Individual photograph URL
- [x] Shareable photograph links

---

# Phase 4: Motion and Interaction

Goal:

Improve the experience without distracting from photography.

## Animations

- [x] Navigation transitions
- [x] Gallery reveal animation
- [x] Image hover behavior
- [ ] Page transition experiments
- [x] Lightbox transitions
- [x] Reduced-motion support

Rules:

Animations should be:

- subtle
- fast
- functional
- optional when accessibility requires it

Avoid excessive animation.

---

# Phase 5: Performance

Goal:

Make the first static portfolio fast while preserving photographic quality.

## Web Image Export (Lesson 16)

These checkboxes document the earlier photo-filled release. The current
zero-content Hero keeps its structure without referencing an old photograph.

- [ ] Keep RAW and high-quality photo archives outside the website repository; publish only web-ready assets
- [ ] Resize the hero export to roughly 2000-2400px on its longest edge
- [ ] Resize gallery exports to roughly 1600-1800px on their longest edge
- [x] Export responsive WebPs with embedded sRGB; compare JPEG and WebP at suitable quality by eye and file size
- [x] Integrate the responsive WebP files into the site
- [ ] Remove redundant large website assets after a separately verified archive exists
- [x] Use actual image dimensions for HTML `width` and `height`, including correct aspect ratios
- [x] Keep the hero eager-loaded and lazy-load below-the-fold gallery images
- [x] Replace numbered placeholder `alt` text with meaningful descriptions of the photographs

The retained responsive WebP set contains real 640px, 1200px, and 1800px-wide
files. In the earlier release, its total size fell from roughly 128 MiB to
6.4 MiB, and the HTML dimensions matched each default `src`. ExifTool confirmed embedded sRGB ICC
profiles in all 30 responsive variants. The 10 source JPEGs and 10 unnumbered
full-resolution WebPs have neither an embedded ICC profile nor EXIF ColorSpace;
`sips` reporting sRGB for the JPEGs does not establish an embedded profile.
At matched 1200px dimensions, those 10 WebPs totaled 1.93 MiB, compared
with 3.28 MiB for temporary JPEG quality 80 and 3.97 MiB at quality 85.
Equal-pixel crops were inspected by eye; the retained WebPs remain available.
See `docs/performance-audit.md` for the method and limits. The 1800px label
describes width: the old Hero and five portrait Gallery variants are 1800 × 2700,
so the longest-edge export targets above remain open. The owner chose to
retain all originals and full-size WebPs in the repository for now.

## Later Image Pipeline

- [ ] Generate thumbnails and medium-resolution images when the collection grows
- [x] Add responsive `srcset` where device-size variants are useful
- [x] Evaluate AVIF after the JPEG/WebP workflow is stable; keep WebP for now (see `docs/avif-evaluation.md`)

Possible future pipeline:

```text
Original Photo
      ↓
Image Processor
      ↓
Thumbnail
Medium
Large
Original
```

## Loading Strategy

- [ ] Progressive gallery loading
- [ ] Pagination or infinite loading
- [ ] Browser caching
- [ ] CDN support
- [x] Evaluate hero image priority after measuring the first load

## Performance Testing

- [x] Check Network panel image sizes and loading order; hero loads first, offscreen gallery images wait
- [x] Measure LCP and CLS on desktop and mobile after the image export is finished
- [x] Lighthouse testing on the local source site, mobile and desktop
- [x] Mobile network testing
- [x] Test 200 synthetic cards at desktop and mobile widths

These checks belong to the earlier image-filled release; the current
zero-content Hero and Gallery require a separate layout and console check.

---

# Phase 6: Photography Data Model

Goal:

Stop defining every photograph manually inside HTML.

Possible photo data:

```json
{
  "id": "tokyo-001",
  "title": "Tokyo Night",
  "category": "street",
  "location": "Tokyo",
  "date": "2026-01-01",
  "thumbnail": "...",
  "image": "...",
  "original": "..."
}
```

Tasks:

- [x] Define initial photograph data structure
- [x] Separate photo data from page markup
- [x] Load gallery dynamically
- [x] Define category system
- [x] Define tag system for browser-local records
- [x] Define optional public metadata fields for browser-local records

This phase may initially use JSON before introducing a database.

Lesson 22 started this phase with `data/photos.js` and one real repository image.
Lesson 24 expanded that data to the nine then-existing portfolio photographs and used
`createPhotoCard()` plus `renderGallery()` to build a filterable homepage
Gallery. Unverified dates remained empty. In the current source, category
filters use the shared category definitions; a category with no photos can
show an empty state. The old Portrait, Documentary, Landscape, and Street
examples are not default content after the reset.

---

# Phase 7: Storage Architecture

Goal:

Support a large photography collection without storing everything in Git.

Target architecture:

```text
Photography Website
        ↓
      CDN
        ↓
Object Storage
```

Research:

- [x] Research Cloudflare R2 for a later storage option
- [x] Research Amazon S3 with CloudFront for a later storage option
- [x] Research Supabase Storage as the near-term object storage option

Create storage structure:

```text
photos/
├── originals/
├── large/
├── medium/
└── thumbnails/
```

Requirements:

- [ ] Stable image URLs
- [ ] CDN delivery
- [ ] cache headers
- [ ] original protection strategy
- [ ] predictable file naming

The comparison, tentative Supabase Storage choice, key layout, access rules,
and live acceptance checks are in `docs/storage-architecture.md` and
`docs/supabase-storage-setup.md`. On 2026-09-23, SQL inspection confirmed the
expected public web-export bucket, private originals bucket, and four
owner-only object policies; neither bucket contained objects at inspection.
No Storage migration was rerun. Owner upload, replacement, public delivery,
and explicit cleanup of test objects subsequently passed. Anonymous upload
was denied; remaining permission/failure checks are listed in the setup guide.
Existing source photographs stay in this repository by the owner's decision.

---

# Phase 8: Backend

Goal:

Create a system that allows photographs to be managed without manually editing code.

Possible architecture:

```text
Frontend
    ↓
API
    ↓
Database
    ↓
Object Storage
```

Tasks:

- [x] Select Supabase as the Lesson 34 database/Data API architecture
- [x] Use the Supabase Data API for public read requests
- [x] Create the `collections` and `photos` database tables
- [x] Connect Supabase Storage for owner-uploaded web exports
- [x] Create the initial collection and photograph records (historical stage;
  those records are being retired)
- [x] Implement shared category definitions, owner CRUD, and merge in source
- [x] Apply the shared category migration in the existing production database
- [ ] Verify all current owner and anonymous category behavior after migration
- [ ] Tag management

## Lesson 34: Supabase Database + API Integration

- [x] Add a browser-safe Supabase client and dedicated read repository
- [x] Keep UI reads behind the existing Content Service
- [x] Preserve localStorage for the explicit local Admin prototype
- [x] Disable cloud-read fallback to old localStorage content for public pages
- [x] Convert Work, Gallery, and Collection reads to async loading/error/empty flows
- [x] Document the `collections` / `photos` schema, relationship, and public-read RLS
- [x] Create the real Supabase project/tables and add its URL plus publishable key
- [x] Verify live cloud reads after the dashboard configuration is available

Lesson 34 intentionally provides public `SELECT` only. Cloud authentication,
Admin writes, image uploads, and unrestricted public CRUD are not part of this
lesson.

Do not begin this phase until the frontend and photography data model are stable.

---

# Phase 9: Admin System

Goal:

Allow photographs to be uploaded and managed through the website.

## Current Browser-local Prototype (Lesson 33)

- [x] Create, edit, and delete Work and Photo records in the current browser
- [x] Persist browser-local changes with localStorage
- [x] Clear browser-local records and categories to the empty default after confirmation
- [x] Connect Admin writes to authenticated cloud data

This prototype is intentionally not a secure cloud CMS. It has no login, still
uses existing-image path fields, and its changes do not update Supabase, Git,
or another device.

`supabase/migrations/20260923_admin_auth.sql` defines owner-only write policies
and optional photo metadata columns. Live owner sign-in, administrator
identity, and the existing Auth/RLS configuration were verified on 2026-09-23.
The default `admin.html` (and compatible `?mode=cloud` URL) has an owner sign-in
gate and repository-backed CRUD code; `?mode=local` retains the browser-local
prototype. Local CRUD tests passed in the earlier implementation. Live temporary row creation/deletion and
category changes passed before the content migration; missing-field and old-FK
errors were then resolved by applying `20260923_collection_content.sql`.
Post-migration owner forms, membership, ordering, single cover/photo uploads
and replacement, and deletion passed using temporary content against real
Supabase **before this reset**. Original rows matched that baseline afterward,
and all test exports were removed. Anonymous INSERT/upload was denied; a
second signed-in non-admin account and the new queue/batch flows remain
untested against the live project.
The static Admin URL itself cannot be server-protected by GitHub Pages; RLS
provides the data boundary.

## Authentication

- [x] Admin login with the verified live owner account
- [ ] Session management
- [ ] Protected admin routes

## Upload

- [x] Select an image for a new or existing Collection/Photo in Work Admin
- [x] Add multiple-photo selection, per-photo review, status, and failed-only retry in source
- [ ] Verify the multiple-photo queue and retry against real Supabase
- [x] Preview the current or newly selected image before saving
- [x] Upload photographs to the live owner-controlled Storage bucket
- [x] Show completed-file progress for the three prepared web exports
- [x] Generate 640px, 1200px, and 1800px WebP exports in the browser
- [x] Generate the 640px Gallery thumbnail export
- [ ] Store originals

Cloud Admin upload handles Collection covers and Photos in the Work section
on create or edit. It accepts JPEG, PNG, WebP, or browser-decodable AVIF at
least 1800 pixels on the longest edge, no larger than 25 MiB or 40 megapixels.
The three export sizes refer to longest edges; portrait and landscape images
keep their proportions, and `srcset` uses each export’s real width. It previews
the current image or selected replacement; without a new file, editing keeps
the old URL. Cloud forms do not require manual image paths. The browser
renders three WebP exports, rejects EXIF/XMP chunks in each output, and never
sends the selected source file to Storage. Progress counts completed files,
not bytes. A database row is saved only after all three uploads succeed.
On an upload or confirmed database failure, the editor attempts to remove
only the new keys from that attempt. Ambiguous writes or cleanup failures
require manual review. Replacing an image does not delete its older objects.

The earlier single-image Collection and Photo create/edit flows, desktop and mobile previews,
database rejection, partial upload failure, and cleanup passed local browser
tests with mocked Storage and database services. A
temporary JPEG containing GPS EXIF was exported in Chromium; ExifTool found
no GPS/EXIF/XMP fields in its 1200px WebP. Real owner tests also uploaded
1080 × 1920 portraits, producing 360 × 640, 675 × 1200, and 1013 × 1800
exports with matching `srcset` widths. Cover/photo replacement, public page
reads, and explicit deletion of all 15 test exports passed. These results do
not establish a universal color-profile guarantee or complete the remaining
non-admin, invalid-upload, overwrite, and injected-failure checks. New cloud
photos currently use generic `photo.html?id=...` pages;
they have no static social preview or download button until those separate
publishing paths are extended.

## Management

- [x] Verify cloud editing of photo title on a temporary record
- [x] Verify cloud editing of category on temporary records
- [ ] Verify cloud editing of tags
- [ ] Verify cloud editing of location
- [ ] Verify cloud editing of description
- [x] Verify cloud deletion of a temporary photograph
- [x] Reorder photographs by an optional numeric display order in Admin

Possible future workflow:

```text
RAW / JPG
    ↓
Upload
    ↓
Metadata extraction
    ↓
Optimization
    ↓
Object Storage
    ↓
Database
    ↓
Published gallery
```

---

# Phase 10: EXIF and Metadata

Goal:

Automatically extract photography information.

Possible fields:

- [x] Capture date EXIF review extraction
- [x] Camera EXIF review extraction
- [x] Lens EXIF review extraction
- [x] Aperture EXIF review extraction
- [x] Shutter speed EXIF review extraction
- [x] ISO EXIF review extraction
- [x] Focal length EXIF review extraction
- [ ] GPS

Privacy rule:

GPS information should never automatically become public.

The command-line review script and the browser's JPEG upload review extract
only supported non-GPS values and a GPS-presence flag. Browser suggestions
require separate per-field acceptance and a Photo save; they are never
published automatically. The 10 current website JPEGs contain none of these
EXIF values. GPS coordinates are not entered into the public site.

Location publishing must remain optional.

---

# Phase 11: Download System

Goal:

Optionally allow visitors to download selected photographs.

Possible options:

```text
No download

Web-size download

High-resolution download

Original download
```

Tasks:

- [x] Offer 1200px WebP downloads for the nine photos in the earlier release
- [x] Limit the website download link to verified same-site web exports
- [x] Use stable `kris-<photo-id>-web.webp` filenames
- [ ] Original image protection
- [ ] Optional watermark strategy

The owner chose web-size downloads only. Earlier browser checks verified all
nine files and filenames at desktop and mobile widths. The current generic
Photo page does not offer downloads for new cloud Storage photos. See
`docs/download-policy.md` for the earlier scope and original-file limit.

---

# Phase 12: Deployment

Goal:

Make the website publicly accessible.

## First Static Release (Lessons 14-15)

- [x] Create a GitHub remote for this repository (`origin`)
- [x] Review completed work, commit it, and push a clean `main`
- [x] Confirm the exact GitHub Pages build-source setting in repository settings
- [x] Confirm the public URL returns `200`
- [x] Test the live hero, Collections, Gallery filters, navigation, Lightbox, and mobile menu
- [x] Confirm the deployed page loads its CSS, scripts, photographs, and Supabase reads without console errors

The previously published site is available at
`https://hyeexy211.github.io/kris-photo-portfolio/`. Deployment verification on
September 23, 2026 covered desktop, 390px mobile, the three Collections, all
nine Gallery photographs, filters, dynamic/static Lightbox flows, browser-local
Admin compatibility, real Supabase `200` reads, and the then-current simulated
cloud fallback. That fallback is disabled in the current source.
The authenticated GitHub Pages API confirmed `main` and repository root as
the current build source, with HTTPS enforced; see
`docs/deployment-settings-audit.md`. After the feature merge, the public
homepage, main CSS/JS files, and `admin/` route were checked against the
merged source. The current zero-content and Work Admin changes need their own
live check.

## Later Production Improvements

- [ ] Custom domain
- [x] HTTPS
- [ ] Production CDN
- [ ] Environment configuration
- [ ] Error monitoring
- [ ] Backup strategy

`scripts/export-public-content.js` makes a read-only, external JSON copy of
public Collections and Photos rows. The current reset's 3/9 archive was read
back and its SHA-256 checked before the audited deletion returned 0/0; see
`docs/content-reset-audit-2026-09-23.md`. The JSON is a recovery aid, not a
database or image backup. Dashboard backup configuration and a restore test
remain manual. Release checks and the monitoring gap are recorded in
`docs/backup-and-monitoring.md`.

Deployment should become repeatable.

Future target:

```text
git push
    ↓
automatic deployment
```

The current site is plain HTML, CSS, and JavaScript; it does not need a build
system for its first release.

---

# Phase 13: SEO and Sharing

- [x] Page titles
- [x] Meta descriptions
- [x] Open Graph images
- [x] Sitemap
- [x] robots.txt
- [x] Generate structured static pages for the nine published photographs
- [x] Give those nine pages individual social preview metadata

These checkboxes record the earlier release. During the zero-content reset, the
nine old static photo pages and seed-based generator were retired. Current
photographs use `photo.html?id=...` with generic initial metadata, and the
sitemap lists only the homepage until a new static publishing process is
chosen. Social crawlers still need a live check after the changed source is
deployed. On a GitHub Pages project site, this repository's `robots.txt` is
served beneath `/kris-photo-portfolio/`; it cannot set the domain-root robots
policy.

---

# Phase 14: Analytics

Goal:

Understand how visitors interact with the portfolio.

Possible metrics:

- page views
- gallery views
- popular photographs
- download activity
- device type
- referring source

Avoid unnecessary invasive tracking.

---

# Long-Term Ideas

These are optional and should not distract from the core portfolio.

- [ ] Photography journal
- [ ] Travel photography map
- [ ] Photo stories
- [ ] Albums
- [ ] Private client galleries
- [ ] Search
- [ ] Favorites
- [ ] Multilingual website
- [ ] Print store
- [ ] Client downloads
- [ ] Photo licensing
- [ ] Photography API

---

# Current Priority

Current development priority:

```text
Non-public export read back; audited old IDs deleted (3/9 → 0/0)
    ↓
Shared category migration applied in production
    ↓
Verify Work Admin, Gallery, empty-state, and retry tests
    ↓
Remove temporary QA content and verify post-test counts (2026-09-23)
    ↓
Synchronize dist, publish commit 2035280, and check GitHub Pages (done)
```

The earlier local release checks are recorded in `docs/performance-audit.md`.
The earlier live owner login, content-field migration, Storage configuration,
and single-photo upload/CRUD checks are recorded in
`docs/crud-test-report-2026-09-23.md`. Its test rows and exports were removed
then; it does not establish completion of this reset. The owner chose to keep
originals and old web images as backups and publish no unverified metadata.

## Manual actions and owner decisions

| Status | Roadmap item | Required action |
| --- | --- | --- |
| COMPLETED; LATER CONTENT PRESERVED | Legacy content reset | Non-public export and exact ID/image manifest were checked; conditional deletion changed 3/9 to 0/0. Temporary QA rows and exports were removed; 2026-09-23 post-test counts were all zero. Four categories added afterward remain in production. Repository image files are retained. |
| APPLIED; CORE BEHAVIOR VERIFIED | Shared categories | `20260923_shared_categories.sql` was applied after the audited reset. Public read, owner write, rename, merge, and unused-category removal passed. The rollback plan is documented, not executed. |
| RELEASED AND ONLINE CHECKED | Current source and dist | Root and ignored dist files matched; Pages built `2035280`. Online zero-content pages, old URLs, desktop English, mobile Chinese, resources, Console, and anonymous Admin passed. Owner editing was verified against real Supabase in the local HTTP preview. |
| OWNER QUEUE/BATCH VERIFIED; NEGATIVE CASE OPEN | Cloud Admin and Auth | Owner multi-photo and batch flows passed with real Supabase; anonymous INSERT was denied. A second signed-in non-admin account remains untested. See `docs/supabase-admin-setup.md`. |
| OWNER UPLOAD VERIFIED; FAILURE INJECTION OPEN | Storage | Owner multi-photo WebP upload and test-export cleanup passed with real Supabase; ambiguous PUT/retry behavior passed mock tests. Real partial failure, invalid path/MIME/size, overwrite, and other negative cases remain. See `docs/supabase-storage-setup.md`. |
| MANUAL ACTION REQUIRED | Complete backup and monitoring | Keep the current non-public JSON export, choose an external backup destination, and test restoration and alerts. The public JSON is only a partial copy. |
| OWNER CONTENT REQUIRED | Real date, location, gear, GPS | Leave the optional fields blank until trustworthy source information and a privacy decision are supplied. |
| OWNER DECISION | Archive and original protection | Keep all originals in the public repository for now, as requested. This means already published originals are publicly accessible even if a private Storage bucket is configured later. |
| HISTORICAL PERFORMANCE NOTE | Retained old image exports | Some old `-1800.webp` files use 1800px width and reach 2700px in height. They remain stored as backups; the zero-content Hero no longer references an old photograph. |
| OPTIONAL | Custom domain, analytics, Street/Cafe, and long-term ideas | Define actual content, service, and privacy requirements before implementation. These are not prerequisites for the current portfolio release. |

---

# Task Rule

Each development session should normally select only one roadmap task.

Example:

```text
Task:
Phase 2 → Add responsive gallery grid
```

Create a dedicated Git branch:

```text
feature/gallery-grid
```

Then follow:

```text
PLAN
 ↓
CODE
 ↓
TEST
 ↓
REVIEW
 ↓
COMMIT
 ↓
MERGE
```

Once completed, mark the roadmap item:

```text
- [x] Add responsive gallery grid
```
