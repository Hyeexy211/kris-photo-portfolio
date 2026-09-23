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
