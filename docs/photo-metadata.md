# Photo metadata model

The current `Photo` keeps its stable `id`, `collectionId`, category, image paths,
dimensions and title. Optional public fields are `date` (`YYYY-MM-DD`),
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

This is currently a local metadata form only. Public pages prefer the existing
Supabase read repository, whose schema still contains only the Lesson 34
fields. Applying a database migration and authenticated writes are separate
roadmap tasks; local Admin edits do not yet appear on the cloud-backed public
site or on another device.
