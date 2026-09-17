# Photography Portfolio Roadmap

This roadmap defines the development path for the photography portfolio.

The goal is to build the project gradually:

```text
Foundation
    ↓
Portfolio
    ↓
Experience
    ↓
Performance
    ↓
Backend
    ↓
Deployment
    ↓
Long-term Platform
```

Avoid implementing later-stage infrastructure before the current stage is stable.

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

- [ ] Portrait
- [ ] Street
- [ ] Landscape
- [ ] Cafe

## Gallery

- [ ] Create gallery layout
- [ ] Create reusable gallery items
- [ ] Add responsive gallery grid
- [ ] Add portrait image handling
- [ ] Add landscape image handling
- [ ] Add image captions
- [ ] Add lazy loading

## Navigation

- [ ] Connect category navigation
- [ ] Add active category state
- [ ] Add smooth transitions between categories

### Phase 2 Definition of Done

Visitors should be able to:

```text
Open website
    ↓
Choose photography category
    ↓
Browse photographs
```

---

# Phase 3: Photography Viewing Experience

Goal:

Make viewing individual photographs immersive.

## Lightbox

- [ ] Click photograph to open
- [ ] Full-screen viewer
- [ ] Close button
- [ ] Previous photograph
- [ ] Next photograph
- [ ] Keyboard navigation
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

- [ ] Navigation transitions
- [ ] Gallery reveal animation
- [ ] Image hover behavior
- [ ] Page transition experiments
- [ ] Lightbox transitions
- [ ] Reduced-motion support

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

Prepare the site for hundreds or thousands of photographs.

## Image Optimization

- [ ] Generate thumbnails
- [ ] Generate medium-resolution images
- [ ] Preserve originals separately
- [ ] Add WebP
- [ ] Evaluate AVIF
- [ ] Responsive `srcset`
- [ ] Lazy loading

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
- [ ] Preload important hero images

## Performance Testing

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

- [ ] Define photograph data structure
- [ ] Separate photo data from page markup
- [ ] Load gallery dynamically
- [ ] Define category system
- [ ] Define tag system
- [ ] Define metadata system

This phase may initially use JSON before introducing a database.

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

Tasks:

- [ ] Production hosting
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
automatic build
    ↓
automatic deployment
```

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
Phase 1
Foundation
    ↓
Phase 2
Photography Portfolio
    ↓
Phase 3
Viewing Experience
```

Do not rush into backend development yet.

The immediate objective is:

> Build a beautiful, responsive, maintainable photography portfolio that works extremely well with a small collection before designing infrastructure for thousands of photographs.

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
