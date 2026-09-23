# Image and performance audit (2026-09-23)

## Image inventory

- `images/` contains 52 tracked files and occupies about 172 MiB locally:
  10 original JPEGs, 40 WebPs and 2 PNGs.
- Current HTML, JavaScript data and Supabase seed paths point to the responsive
  `-640.webp`, `-1200.webp` and `-1800.webp` files. No current page/data/seed
  reference to an original JPEG or the unnumbered full-size WebPs was found.
- The hero `-1800.webp` is 1800 × 2700 pixels and has a 640px alternative.
  The JPEG original is 4672 × 7008 pixels. `sips` reports the WebP as RGB;
  this alone does not prove an embedded sRGB profile.
- Original photographs were retained. Their archive destination and integrity
  have not been established, so deleting them from Git would risk user content.
  The owner chose on 2026-09-23 to keep them in the repository for now.

## Browser measurement

Local source served by `python3 -m http.server` at `127.0.0.1:4173`.
Chromium Playwright, fresh context for each viewport, device scale factor 1,
and CDP network emulation (150 ms latency, 200,000 bytes/s download) were used.
These are local lab observations, not Lighthouse scores or real-user vitals.

| Viewport | LCP and element | CLS | Hero request | Gallery | Errors / overflow |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 1,036 ms, site `h1` | 0 | `hero-01-1800.webp`, 200, about 254 kB transferred | 9 cards | No page errors or horizontal overflow |
| 390 × 844 | 992 ms, site `h1` | 0 | `hero-01-640.webp`, 200, about 43 kB transferred | 9 cards | No page errors or horizontal overflow |

The hero was the first requested image at both widths. The browser selected
the smaller `srcset` candidate on mobile. Desktop also requested three Work
covers; the mobile viewport requested two near-viewport Work covers. The
Gallery's below-fold images were absent from this initial request list, as
expected for lazy loading. A desktop/mobile live Lighthouse run and field
measurements are still needed before making performance claims about the
published site. The current measurements do not justify changing image
priority or replacing the existing exports.

## Lighthouse and larger Gallery check

Lighthouse 13.5.0 ran against the local source HTTP server on 2026-09-23 in
Headless Chrome 153. The mobile run used Lighthouse's default mobile settings;
the desktop run used `--preset=desktop`. These are single lab runs, not scores
for the published GitHub Pages site or real visitors.

| Local mode | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 98 | 100 | 100 | 100 | 0.9 s | 2.4 s | 0 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.2 s | 0.6 s | 0 ms | 0 |

The first Lighthouse pass found the site's muted `#777777` text barely below
the WCAG contrast threshold on white. Changing the existing muted color token
to `#767676` made the contrast audit pass in both final runs. Lighthouse also
suggested minifying or removing some CSS/JavaScript, with estimated savings of
roughly 150 ms on mobile for CSS; the current static site has no build step, so
those suggestions do not justify adding one for nine photos.

A separate browser stress check made 200 synthetic cards from the nine real
photo records without changing project data. At 1440px and 390px, the initial
render took 6.8 ms and 5.1 ms respectively in those individual runs. Both
widths retained exactly 200 distinct cards after an All → Portrait → All
filter cycle, kept Lightbox next order correct, and showed no page errors or
horizontal overflow. These observations support the current nine-photo UI;
they are not a limit test for thousands of unique files or concurrent image
downloads. Progressive loading and pagination can wait until the collection
actually grows.

Reproduce the Lighthouse checks from a running local HTTP server with:

```sh
npx --yes lighthouse@13.5.0 http://127.0.0.1:4173/ --output=json --output-path=/tmp/kris-lighthouse-mobile.json --chrome-flags='--headless --no-sandbox' --quiet
npx --yes lighthouse@13.5.0 http://127.0.0.1:4173/ --preset=desktop --output=json --output-path=/tmp/kris-lighthouse-desktop.json --chrome-flags='--headless --no-sandbox' --quiet
```

The CLI was used only for the audit; it was not added to the project. Repeat
against the deployed branch after release, because hosting headers, remote
requests and real network conditions may change the result.

## Reproduction

1. Serve the project root over HTTP.
2. In Chromium DevTools Network, disable cache and throttle the connection.
3. At 1440px and 390px widths, reload and inspect the hero's selected
   `currentSrc`, requested order and offscreen image requests.
4. Use the Performance panel or Lighthouse to compare LCP and CLS on the
   published site when production measurements are needed.
