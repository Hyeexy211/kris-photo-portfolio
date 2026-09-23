# Photo metadata model

The current `Photo` keeps its stable `id`, `collectionId`, category, image paths,
dimensions and title. A Photo belongs to at most one Collection; Gallery still
contains every Photo. `collectionOrder` controls its position only within that
Collection, leaving the Gallery's global `order` unchanged. Old records without
`collectionOrder` use their existing order as a compatible display order.
`alt` may describe the visible image separately from its title; when left blank,
the title is used. Optional public fields are `date` (`YYYY-MM-DD`),
`captureTime` (local `HH:MM` or `HH:MM:SS`, with no assumed timezone),
`location`, `description`, `camera`, `lens`, `focalLength`, `aperture`,
`shutterSpeed`, `iso`, and `tags` (an array of short strings). A Collection's
optional `story` is plain text and may contain multiple paragraphs.

The local and cloud Admin forms accept these fields. Comma-separated tags are
trimmed and stored as an array; an empty tag input becomes `[]`. Existing seed
records and previously saved records do not need empty placeholder fields.
The individual photo page displays only fields that have values.

No capture dates, places, camera models or tags have been inferred from file
names or timestamps. The website must never automatically publish GPS. EXIF
review must not place GPS coordinates in the form, public `photos` row, or
generated web images. A local EXIF timestamp without a trusted timezone stays
a local time; it must not be converted to UTC or used to infer a location.

The repository maps optional fields to empty values when older browser records
or a pre-migration cloud table lacks them. Public cloud reads continue before
the new fields exist. Cloud writes to `story`, `collection_order`, and
`capture_time`, plus safe Collection deletion, require
`supabase/migrations/20260923_collection_content.sql`. On 2026-09-23, the
earlier missing-column failures were resolved by applying that migration in
the live Supabase project. SQL verification confirmed `story` as text,
`collection_order` as integer, `capture_time` as time without time zone, and
the Collection foreign key as `ON DELETE SET NULL`. Counts remained at three
Collections and nine Photos; every pre-existing field, including creation and
update timestamps, had an unchanged comparison hash. Post-migration owner
tests connected the current source's HTTP preview to real Supabase: story
editing, capture-time saving and clearing, membership, independent Collection
ordering, and Collection deletion while retaining Photos passed. Temporary
records were removed, and all original row values and timestamps were
compared successfully. See `docs/crud-test-report-2026-09-23.md` for the
complete scope and remaining permission checks. Local Admin edits do not
appear on the cloud-backed public site or on another device.

## Browser JPEG EXIF candidate review

When a JPEG is selected in Cloud Admin, the browser reviews its EXIF before
Canvas creates the three WebP exports. Browser-local Admin offers the same
review without uploading the selected file; image paths are still entered
manually there. The parser currently reads common JPEG fields:
capture date and local time, camera make/model, lens model, focal length,
aperture, shutter speed and ISO. Each returned value is an editable candidate
with Accept, Reject and Clear actions. Accept copies that field to the manual
form; saving the Photo is still required to publish it. Choosing another file
does not overwrite previously edited manual fields. Missing, damaged or
unsupported EXIF leaves the manual form available and does not block upload.
Only GPS presence is reported; the parser never reads or returns coordinates.
RAW files, videos and other formats have no automatic metadata import here.

This browser review is separate from the optional command-line script below.
The browser does not run ExifTool.

## Read-only command-line EXIF review

If ExifTool is installed, `python3 scripts/exif-review.py image.jpg` prints a
JSON review record. It reads capture date, camera, lens, aperture, shutter,
ISO and focal length. It reports only whether GPS exists; the coordinates are
never printed, saved or published by this script. The output still requires
human review before any value is entered in Admin.

All 10 JPEGs currently tracked under `images/` were inspected on 2026-09-23.
None contained `DateTimeOriginal`, Make/Model, LensModel, FNumber,
ExposureTime, ISO, FocalLength or GPS coordinates. No capture information can
be populated from these files, and file timestamps are not substitutes.
The owner also confirmed that no trusted date, location or gear notes are
currently available; these fields stay empty.
