# Photo metadata model

The current `Photo` keeps its stable `id`, `collectionId`, category, image paths,
dimensions and title. `alt` may describe the visible image separately from
its title; when left blank, the title is used. Optional public fields are
`date` (`YYYY-MM-DD`),
`location`, `description`, `camera`, `lens`, `focalLength`, `aperture`,
`shutterSpeed`, `iso`, and `tags` (an array of short strings).

The browser-local Admin form accepts these fields. Comma-separated tags are
trimmed and stored as an array; an empty tag input becomes `[]`. Existing seed
records and previously saved records do not need empty placeholder fields.
The individual photo page displays only fields that have values.

No capture dates, places, camera models or tags have been inferred from file
names or timestamps. The website must never automatically publish GPS. A later
EXIF importer must put any GPS coordinates in private review data, outside the
public `photos` row, and require explicit location approval before publication.

The local form works now. The public Supabase repository maps optional columns
when they exist, while the live database still has only the Lesson 34 fields.
Applying the Admin migration and testing authenticated writes are separate
roadmap tasks; local Admin edits do not appear on the cloud-backed public site
or on another device.

## Read-only EXIF review

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
