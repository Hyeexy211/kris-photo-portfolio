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

Checkboxes describe verified work in this repository. They do not imply that
the work branch has been merged to the public GitHub Pages `main` branch.

---

# Current Project Status (2026-09-23)

## Completed

- Native HTML/CSS/JavaScript responsive portfolio foundation
- Three real Collection pages plus the reusable `collection.html?slug=...` page
- Data-driven Work and Gallery rendering, category filters, Reveal, and Lightbox
- Responsive 640px, 1200px, and 1800px WebP delivery for current photographs
- Browser-local Content Admin prototype with localStorage persistence
- Content Service plus local and Supabase Repository boundaries
- Real Supabase `collections` / `photos` tables, seed data, public-read RLS, and verified cloud reads
- Public GitHub Pages release at `https://hyeexy211.github.io/kris-photo-portfolio/`
- On `feature/roadmap-completion`: nine static photograph pages with individual
  previews, captions and mobile Lightbox swipe, optional local tags/metadata,
  1200px web-size downloads, sitemap, and local performance checks
- On that branch: authenticated cloud Admin code, owner-only RLS migration,
  Storage bucket migration, a new-photo web-export upload path, and a
  public-content export script are prepared; their live account and Storage
  flows have **not** been verified

## In Progress

- Owner Auth enrollment, live RLS and Storage checks, and release of this branch
- Phase 5 archive cleanup is paused by the owner's decision to keep originals
  in the public repository; real photographs have no verified date, location,
  or equipment values to publish

## Next

- Review and merge the work branch, then verify the deployed site and social previews
- Apply and test the prepared cloud migrations after the real owner Auth account
  and access policies are reviewed in Supabase

## Deferred

- Original-file removal, verified but unavailable photo metadata, and a decision
  about Street/Cafe work
- Live upload release, source-file archive, production CDN, monitoring, custom
  domain, and full database/image backup until service and account setup is available
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

Metadata should only be displayed when useful.
The interfaces accept these optional fields, but the nine published photos
have no owner-confirmed values. Their public values intentionally stay blank.

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

- [ ] Keep RAW and high-quality photo archives outside the website repository; publish only web-ready assets
- [ ] Resize the hero export to roughly 2000-2400px on its longest edge
- [ ] Resize gallery exports to roughly 1600-1800px on their longest edge
- [x] Export responsive WebPs with embedded sRGB; compare JPEG and WebP at suitable quality by eye and file size
- [x] Integrate the responsive WebP files into the site
- [ ] Remove redundant large website assets after a separately verified archive exists
- [x] Use actual image dimensions for HTML `width` and `height`, including correct aspect ratios
- [x] Keep the hero eager-loaded and lazy-load below-the-fold gallery images
- [x] Replace numbered placeholder `alt` text with meaningful descriptions of the photographs

The responsive WebP set now contains real 640px, 1200px, and 1800px-wide
files. Its total size fell from roughly 128 MiB to 6.4 MiB, and the HTML
dimensions match each default `src`. ExifTool confirms embedded sRGB ICC
profiles in all 30 responsive variants. The 10 source JPEGs and 10 unnumbered
full-resolution WebPs have neither an embedded ICC profile nor EXIF ColorSpace;
`sips` reporting sRGB for the JPEGs does not establish an embedded profile.
At matched 1200px dimensions, 10 current WebPs totaled 1.93 MiB, compared
with 3.28 MiB for temporary JPEG quality 80 and 3.97 MiB at quality 85.
Equal-pixel crops were inspected by eye; the current WebPs remain suitable.
See `docs/performance-audit.md` for the method and limits. The 1800px label
describes width: the hero and five portrait Gallery variants are 1800 × 2700,
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

Lesson 22 starts this phase with `data/photos.js` and one real repository image.
Lesson 24 expands that data to the nine existing portfolio photographs and uses
`createPhotoCard()` plus `renderGallery()` to build a filterable homepage
Gallery. Unverified dates remain empty and are not rendered. The category
filters preserve the repository's real Portrait, Documentary and Landscape
collections. The requested Street filter remains available as an honest empty
state until real Street work is added.

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
`docs/supabase-storage-setup.md`. A bucket/RLS migration is committed but has
not run in the live project. No bucket or CDN is configured yet. Existing
source photographs stay in this repository by the owner's decision.

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
- [ ] Connect object storage
- [x] Create the initial collection and photograph records
- [ ] Category management
- [ ] Tag management

## Lesson 34: Supabase Database + API Integration

- [x] Add a browser-safe Supabase client and dedicated read repository
- [x] Keep UI reads behind the existing Content Service
- [x] Preserve localStorage as the local repository and cloud-read fallback
- [x] Convert Work, Gallery, and Collection reads to async loading/error/empty flows
- [x] Document the `collections` / `photos` schema, relationship, seed, and public-read RLS
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

- [x] Create, edit, and delete Work and Gallery records in the current browser
- [x] Persist browser-local changes with localStorage
- [x] Restore the repository seed data
- [ ] Connect Admin writes to authenticated cloud data

This prototype is intentionally not a secure cloud CMS. It has no login and its
changes do not update Supabase, Git, or another device.

`supabase/migrations/20260923_admin_auth.sql` prepares owner-only write policies
and optional photo metadata columns, but the live project has not run it.
`admin.html?mode=cloud` has an owner sign-in gate and repository-backed CRUD
code; local mock tests passed, but no real authenticated cloud write was made.
Creating the owner's Auth user, enrolling its real UUID, and testing the live
policies are manual actions before cloud Admin can be marked complete.
The static Admin URL itself cannot be server-protected by GitHub Pages; RLS
provides the data boundary.

## Authentication

- [ ] Admin login
- [ ] Session management
- [ ] Protected admin routes

## Upload

- [x] Select a new photograph in the prepared Cloud Admin form
- [ ] Upload photographs to the live owner-controlled Storage bucket
- [x] Show completed-file progress for the three prepared web exports
- [x] Generate 640px, 1200px, and 1800px WebP exports in the browser
- [x] Generate the 640px Gallery thumbnail export
- [ ] Store originals

The prepared upload path is limited to **new** cloud photographs. It accepts
JPEG, WebP, or browser-decodable AVIF at least 1800 pixels wide, no larger than
25 MiB or 40 megapixels. The browser renders three WebP exports, rejects
EXIF/XMP chunks in each output, and never sends the selected source file to
Storage. Progress counts completed files, not bytes. A photo database row is
created only after all three uploads succeed. On an upload or confirmed
database failure, the editor attempts to remove only the new keys from that
attempt and reports any cleanup failure. A network-ambiguous database result
requires manual review before deleting those objects.

The desktop and mobile upload flow, partial failure, database rejection, and
cleanup failure passed local browser tests with a mocked Storage service. A
temporary JPEG containing GPS EXIF was exported in Chromium; ExifTool found
no GPS/EXIF/XMP fields in its 1200px WebP. This does not establish a universal
color-profile guarantee or replace live Auth, bucket, RLS, upload, and public
page checks. New cloud photos currently use generic `photo.html?id=...` pages;
they have no static social preview or download button until those separate
publishing paths are extended.

## Management

- [ ] Verify cloud editing of photo title
- [ ] Verify cloud editing of category
- [ ] Verify cloud editing of tags
- [ ] Verify cloud editing of location
- [ ] Verify cloud editing of description
- [ ] Verify cloud deletion of a photograph
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

The review script extracts only non-GPS values and a GPS-presence flag. The
10 current website JPEGs contain none of these EXIF values; automatic
publication and private GPS handling remain open.

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

- [x] Offer 1200px WebP downloads for the nine published photos
- [x] Limit the website download link to verified same-site web exports
- [x] Use stable `kris-<photo-id>-web.webp` filenames
- [ ] Original image protection
- [ ] Optional watermark strategy

The owner chose web-size downloads only. Browser checks verified all nine
downloaded files and filenames at desktop and mobile widths. See
`docs/download-policy.md` for the scope and the current original-file limit.

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

The public site is available at
`https://hyeexy211.github.io/kris-photo-portfolio/`. Deployment verification on
September 23, 2026 covered desktop, 390px mobile, the three Collections, all
nine Gallery photographs, filters, dynamic/static Lightbox flows, browser-local
Admin compatibility, real Supabase `200` reads, and simulated cloud fallback.
The authenticated GitHub Pages API confirmed `main` and repository root as
the current build source, with HTTPS enforced; see
`docs/deployment-settings-audit.md`. This work branch is not deployed there.

## Later Production Improvements

- [ ] Custom domain
- [x] HTTPS
- [ ] Production CDN
- [ ] Environment configuration
- [ ] Error monitoring
- [ ] Backup strategy

`scripts/export-public-content.js` now makes a read-only, external JSON copy
of the public Collections and Photos rows; it was checked against the live
3-Collection/9-Photo data. This is a recovery aid, not a database or image
backup. Dashboard backup configuration, a separate copy, and a restore test
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

The sitemap lists the nine static photo pages. `node scripts/generate-photo-pages.js`
regenerates them from the seed; `--source=supabase` reads those same nine IDs
from the public cloud table after a Cloud Admin edit. Review and deploy the
generated files to update their preview metadata. New cloud-only photos still
use `photo.html?id=...` with generic initial metadata, and a removed seed photo
needs a deliberate static-page/sitemap review. Social crawlers still need a
live check after this branch is deployed. On a GitHub Pages project site,
this repository's `robots.txt` is served beneath `/kris-photo-portfolio/`;
it cannot set the domain-root robots policy.

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
Review feature/roadmap-completion and merge when approved
    ↓
Verify Pages, social previews, downloads, and public reads after deployment
    ↓
Enroll the real owner Auth account and test the prepared RLS/Storage migrations
    ↓
Choose whether to activate upload, analytics, and optional platform ideas
```

The local release checks are complete as recorded in `docs/performance-audit.md`.
Cloud Admin and Storage remain prepared code and migrations until real account,
permissions, upload, and recovery checks pass. The owner has decided to keep
originals in the repository and to publish no unverified photo metadata.

## Manual actions and owner decisions

| Status | Roadmap item | Required action |
| --- | --- | --- |
| MANUAL ACTION REQUIRED | Release this work branch | Review and merge to `main`, then check the live GitHub Pages build, image downloads, links, Console, and social previews. |
| MANUAL ACTION REQUIRED | Cloud Admin and Auth | Create the real owner Auth user, apply `20260923_admin_auth.sql`, enroll that user's verified UUID, and test owner, other-user, and anonymous reads/writes. See `docs/supabase-admin-setup.md`. |
| MANUAL ACTION REQUIRED | Storage and CDN | Review existing policies, apply `20260923_storage_buckets.sql`, test access with expendable files, then stage and verify web exports before changing any photo URL. See `docs/supabase-storage-setup.md`. No live bucket is claimed. |
| MANUAL ACTION REQUIRED | Complete backup and monitoring | Select an external backup destination and monitoring service, then test restoration and production alerts. The public JSON export is only a partial copy. |
| OWNER CONTENT REQUIRED | Real date, location, gear, GPS | Leave the optional fields blank until trustworthy source information and a privacy decision are supplied. |
| OWNER DECISION | Archive and original protection | Keep all originals in the public repository for now, as requested. This means already published originals are publicly accessible even if a private Storage bucket is configured later. |
| OWNER REVIEW | Hero and portrait longest-edge exports | Current `-1800.webp` files use 1800px width and reach 2700px in height. Local mobile Lighthouse scored 98. Re-exporting to the earlier longest-edge targets would change photo detail; review full-size appearance before replacing them. |
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
