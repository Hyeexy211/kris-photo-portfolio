# Remaining roadmap execution plan

This plan was checked against the source and `docs/roadmap.md` on 2026-09-23.
The verified baseline is a published static portfolio with three Collections,
nine Photos, a browser-local Admin prototype, and public read-only Supabase.
The roadmap also contains optional ideas and owner decisions; a checked box
requires verified behavior, not merely a proposed implementation.

| Stage | Goal and affected modules | Dependencies | Verification and completion criterion |
| --- | --- | --- | --- |
| 1. Performance and archive audit | Measure current responsive images, loading order, LCP/CLS, and repository image inventory; `index.html`, `images/`, this document, and `docs/roadmap.md`. | Existing web exports and local HTTP preview. | Real paths and dimensions checked, desktop/mobile browser measurements recorded. Original archive cleanup remains open until an external archive location is selected and verified. |
| 2. Viewing and metadata | Fill the feasible Gallery/Lightbox, tag, caption, and photo metadata gaps; `data/`, `js/main.js`, `collection.html`, CSS, and SQL schema where needed. | Stable photo IDs and confirmed metadata. | Desktop/mobile, keyboard/touch, empty data and missing metadata all work without inventing facts. |
| 3. Authenticated content management | Add an authenticated repository and protected Admin flow while keeping public reads and local fallback; `js/config/`, `js/repositories/`, `js/content-service.js`, `admin.html`, `js/admin.js`, SQL migration and setup guide. | Supabase Auth configuration and SQL migration in the real project. | Unauthenticated writes fail; signed-in owner can create/edit/delete and public pages read the result. Live completion requires owner account and dashboard migration. |
| 4. Image storage and processing | Select storage service, upload images, produce web variants, protect originals, and attach metadata; storage configuration, Admin UI, schema and docs. | Storage service, access rules, processing method, and enough test assets. | Upload/progress/failure/retry, variants, privacy and access are tested end to end. Billing and dashboard configuration may require owner action. |
| 5. Downloads | Implement explicitly permitted download sizes and stable naming; viewing UI, storage policies, and docs. | Owner decides which photos and resolutions can be downloaded; protected original storage. | Allowed files download, unapproved originals are inaccessible. |
| 6. Search, sharing, deployment and quality | Finish sitemap/robots/photo URLs, sharing, production configuration, monitoring, backup and measured performance; page files, deployment config and README. | Stable public URLs and domain/monitoring choices. | Live desktop/mobile and network checks, metadata validation, recovery check and deployment verification pass. |
| 7. Optional platform ideas | Decide which journal, map, private galleries, licensing and other ideas are actually desired. | Owner content and product decisions. | Each selected idea gets its own acceptance criteria and verification; unselected ideas remain explicitly optional. |

After each completed stage: inspect the diff, run applicable checks, commit one
coherent change, and push the working branch. A stage that depends on dashboard
access or owner content is documented as manual work; independent stages can
continue. The current site has no package scripts, build system, or test suite,
so browser checks, syntax checks and `git diff --check` are the available gates.

## Execution result (2026-09-23)

The feasible local stages were implemented on `feature/roadmap-completion`,
pushed to `origin`, and fast-forward merged into local `main`. GitHub Pages
builds `main` from the repository root; the merged changes still need a live
check after `main` is pushed. The owner asked to leave `Weblesson.docx` outside
this work.

| Roadmap area | Result in the merged source | Evidence and remaining boundary |
| --- | --- | --- |
| Viewing, URLs, sharing | Lightbox captions/swipe, nine static photo pages with individual previews, sitemap and crawler files | Desktop/mobile browser checks and `docs/roadmap.md` Phase 3/13; live social previews need a post-merge check |
| Photo data and EXIF | Optional tags/metadata fields and private EXIF review | Existing nine date/location/gear values stay blank; see `docs/photo-metadata.md` |
| Performance and downloads | Local LCP/CLS/Lighthouse, 200-card exercise, color/format review, 1200px WebP download links | `docs/performance-audit.md`, `docs/avif-evaluation.md`, `docs/download-policy.md`; originals remain public by owner choice |
| Cloud Admin | Owner sign-in gate, repository-backed CRUD, owner-only RLS migration | Local mock tests passed; real owner account, migration and live RLS checks still required |
| Storage and upload | Supabase bucket migration plus new-photo WebP export/upload flow | Local mock and GPS-export tests passed; no bucket or real upload has been configured or verified |
| Recovery and release | Public-content JSON export, Pages source/HTTPS audit, release checklist | Export is partial; full backup/restore and monitoring need owner service setup |

Final local gates after the upload change: all JavaScript files passed
`node --check`, Python scripts passed AST parsing, `git diff --check`
passed, all 106 files in ignored `dist/` matched their source copies, and
the sitemap had 16 unique URLs matching the nine static photo pages. Browser
checks at 1440px and 390px covered the homepage, three dynamic Collections,
three legacy project pages, nine photo pages and exact 1200px downloads,
local Admin, the unauthenticated cloud gate, and a mocked owner upload flow.
The checked routes had no page/console/network errors or horizontal overflow.

The remaining manual actions and owner decisions are listed in
`docs/roadmap.md` under **Manual actions and owner decisions**. The merged
source is ready for a static-site release check; production claims about Auth,
Storage, backups, monitoring or deployed previews require the live checks
described there.
