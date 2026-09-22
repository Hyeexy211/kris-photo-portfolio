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

Checkboxes describe completed work. An item present only in the uncommitted
working tree stays open until it has been checked and is ready to publish.

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
- [ ] Add image captions

## Navigation

- [x] Connect Work navigation to the project cards
- [ ] Add active category state
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
- [ ] Mobile swipe support

## Photo Information

- [ ] Photo title
- [ ] Location
- [ ] Shooting date
- [ ] Camera
- [ ] Lens
- [ ] Focal length
- [ ] Aperture
- [ ] Shutter speed
- [ ] ISO

Metadata should only be displayed when useful.

The interface should remain visually minimal.

## URL Support

Future possibility:

```text
/photos/tokyo-night-001
```

- [ ] Individual photograph URL
- [ ] Shareable photograph links

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
- [ ] Export in sRGB; compare JPEG and WebP at suitable quality by eye and file size
- [ ] Finish integrating the WebP files into the site and remove redundant large website assets when safe
- [x] Use actual image dimensions for HTML `width` and `height`, including correct aspect ratios
- [x] Keep the hero eager-loaded and lazy-load below-the-fold gallery images
- [x] Replace numbered placeholder `alt` text with meaningful descriptions of the photographs

The responsive WebP set now contains real 640px, 1200px, and 1800px-wide
files. Its total size fell from roughly 128 MiB to 6.4 MiB, and the HTML
dimensions match each default `src`. The original JPEGs and redundant
full-resolution WebPs are still in the repository, so archive cleanup and
color-profile verification remain open tasks.

## Later Image Pipeline

- [ ] Generate thumbnails and medium-resolution images when the collection grows
- [x] Add responsive `srcset` where device-size variants are useful
- [ ] Evaluate AVIF after the JPEG/WebP workflow is stable

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
- [ ] Evaluate hero image priority after measuring the first load

## Performance Testing

- [ ] Check Network panel image sizes and loading order; hero loads first, offscreen gallery images wait
- [ ] Measure LCP and CLS on desktop and mobile after the image export is finished
- [ ] Lighthouse testing
- [ ] Mobile network testing
- [ ] Large gallery testing

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
- [x] Define the Collection data structure
- [x] Separate Collection data from homepage markup
- [x] Render Work cards from ordered Collection data
- [x] Link Photo to Collection with `collectionId`
- [x] Add a shared Content Service query layer
- [x] Add one slug-driven Collection page template
- [ ] Define tag system
- [ ] Define metadata system

This phase may initially use JSON before introducing a database.

Lesson 22 starts this phase with `data/photos.js` and one real repository image.
Lesson 24 expands that data to the nine existing portfolio photographs and uses
`createPhotoCard()` plus `renderGallery()` to build a filterable homepage
Gallery. Unverified dates remain empty and are not rendered. The category
filters preserve the repository's real Portrait, Documentary and Landscape
collections. The requested Street filter remains available as an honest empty
state until real Street work is added.

The CMS foundation keeps the existing static hosting model while introducing a
second content entity. `data/collections.js` owns Collection records,
`data/photos.js` owns Photo records, and `photo.collectionId` creates the
one-to-many relationship without copying Photo objects into a Collection. The
public UI reads both through `js/content-service.js`. Existing static pages in
`projects/` remain available for compatibility while new Work cards use the
shared `collection.html?slug=...` template.

Photos without a `collectionId` are allowed and can still appear in the main
Gallery. They simply do not appear in a Collection query.

---

# CMS Course Route: Lessons 27+

This course route extends the completed static-portfolio lessons without
deleting the earlier phase history.

## Content Foundation

- [x] Lesson 27 — Content Architecture: separate Collection, Photo, UI and storage responsibilities
- [x] Lesson 28 — Collections Data Layer: migrate the three real Work records to `data/collections.js`
- [x] Lesson 29 — Dynamic Work Rendering: use `createWorkCard()` and `renderWorks()`
- [x] Lesson 30 — Dynamic Collection Page: render one template from a URL slug
- [x] Lesson 31 — Photo / Collection Relationship: add nullable `photo.collectionId`
- [x] Lesson 32 — Content Service Layer: centralize public content queries

## Admin Prototype

- [ ] Lesson 33 — Admin Dashboard: add a read-only overview before editing features
- [ ] Lesson 34 — Work CRUD: prototype Collection create, read, update and delete
- [ ] Lesson 35 — Gallery CRUD: prototype Photo create, read, update and delete
- [ ] Lesson 36 — Admin Forms: validation, errors, cancel/reset and accessible form states

Lessons 34–36 may use a LocalStorage Adapter for learning and prototyping. That
adapter must stay behind the Content Service boundary and must be clearly
labelled as browser-local prototype storage, not a production CMS database.

## Production Content System

- [ ] Lesson 37 — Backend Introduction: choose responsibilities and API boundaries
- [ ] Lesson 38 — Database: persist Collection and Photo records
- [ ] Lesson 39 — Image Storage: upload derivatives and originals outside Git
- [ ] Lesson 40 — Real Collection CRUD: connect Work management to the backend
- [ ] Lesson 41 — Real Gallery CRUD: connect Photo management to the backend
- [ ] Lesson 42 — Admin Authentication: protect all write operations

Do not expose production write credentials in browser JavaScript. Database,
object-storage and authentication work begins only after the public data model
and prototype UI are stable.

## Discovery and Viewing

- [ ] Lesson 43 — Advanced Gallery Filters
- [ ] Lesson 44 — Timeline
- [ ] Lesson 45 — Search
- [ ] Lesson 46+ — Continue performance, accessibility, SEO, sharing and photography-viewing improvements

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

- [ ] Cloudflare R2
- [ ] Amazon S3
- [ ] other S3-compatible services

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

- [ ] Select backend architecture
- [ ] Create API
- [ ] Create database
- [ ] Connect object storage
- [ ] Create photograph records
- [ ] Category management
- [ ] Tag management

Do not begin this phase until the frontend and photography data model are stable.

---

# Phase 9: Admin System

Goal:

Allow photographs to be uploaded and managed through the website.

## Authentication

- [ ] Admin login
- [ ] Session management
- [ ] Protected admin routes

## Upload

- [ ] Select photographs
- [ ] Upload photographs
- [ ] Upload progress
- [ ] Automatic optimization
- [ ] Generate thumbnails
- [ ] Store originals

## Management

- [ ] Edit photo title
- [ ] Edit category
- [ ] Edit tags
- [ ] Edit location
- [ ] Edit description
- [ ] Delete photograph
- [ ] Reorder photographs

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

- [ ] Capture date
- [ ] Camera
- [ ] Lens
- [ ] Aperture
- [ ] Shutter speed
- [ ] ISO
- [ ] Focal length
- [ ] GPS

Privacy rule:

GPS information should never automatically become public.

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

- [ ] Download button
- [ ] Download permissions
- [ ] Download file naming
- [ ] Original image protection
- [ ] Optional watermark strategy

---

# Phase 12: Deployment

Goal:

Make the website publicly accessible.

## First Static Release (Lessons 14-15)

- [x] Create a GitHub remote for this repository (`origin`)
- [ ] Finish and review the current image changes, then commit and push a clean `main`
- [ ] Configure GitHub Pages to deploy from `main` / root, if GitHub Pages is the chosen host
- [ ] Confirm the live URL from the host's settings or deployment status
- [ ] Test the live hero, all three galleries, navigation, lightbox, and mobile menu
- [ ] Check that every image, CSS file, and script loads at the published URL

The local `origin` configuration and `origin/main` tracking show that this
checkout is connected to GitHub, but do not confirm that GitHub Pages is
configured or that the site is live.
Release readiness must be checked from the current checkout. Source or `dist/`
changes are not a deployment until they are reviewed, committed, pushed and
verified at the configured public URL.

## Later Production Improvements

- [ ] Custom domain
- [ ] HTTPS
- [ ] Production CDN
- [ ] Environment configuration
- [ ] Error monitoring
- [ ] Backup strategy

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

- [ ] Page titles
- [ ] Meta descriptions
- [ ] Open Graph images
- [ ] Sitemap
- [ ] robots.txt
- [ ] Structured photo pages
- [ ] Social sharing previews

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
Lessons 27-32
Verify and publish the Collection / Photo content foundation
    ↓
Lesson 33
Build a read-only Admin Dashboard shell
    ↓
Lessons 34-36
Add LocalStorage-backed CRUD as an explicitly labelled prototype
    ↓
Lessons 37-42
Choose and connect production backend, storage and authentication
```

The static release, image-performance checks and live-site verification remain
open operational work. CMS lessons must not bypass them or introduce a backend
before the public data model is stable.

The immediate objective is:

> Verify the data-driven Work cards, Collection template, Photo relationships,
> Content Service boundary and source-to-`dist/` parity. Then review the branch
> before beginning the Admin prototype.

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
