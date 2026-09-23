-- Lesson 34 seed snapshot derived from data/collections.js and data/photos.js.
-- It uses only the repository's real assets and confirmed metadata.

insert into public.collections (
    id, slug, title, description, cover, cover_srcset, cover_alt,
    cover_width, cover_height, year, location, category, sort_order
)
values
    (
        'portrait', 'portrait', 'Portrait',
        'Rainy windows, reflected light and quiet moments observed from indoors.',
        'images/portrait/portrait-01-1200.webp',
        'images/portrait/portrait-01-640.webp 640w, images/portrait/portrait-01-1200.webp 1200w, images/portrait/portrait-01-1800.webp 1800w',
        'A rain-darkened window frames trees and a passing car',
        1200, 1800, '', '', 'portrait', 1
    ),
    (
        'documentary', 'documentary', 'Documentary',
        'Quiet interiors, plants and objects observed in soft light.',
        'images/documentary/documentary-01-1200.webp',
        'images/documentary/documentary-01-640.webp 640w, images/documentary/documentary-01-1200.webp 1200w, images/documentary/documentary-01-1800.webp 1800w',
        'White flowers and a veiled mannequin beside an old window',
        1200, 1800, '', '', 'documentary', 2
    ),
    (
        'landscape', 'landscape', 'Landscape',
        'Three views of city light, changing skies and a garden path.',
        'images/landscape/landscape-01-1200.webp',
        'images/landscape/landscape-01-640.webp 640w, images/landscape/landscape-01-1200.webp 1200w, images/landscape/landscape-01-1800.webp 1800w',
        'City lights beneath a pink dusk sky and silhouetted branches',
        1200, 511, '', '', 'landscape', 3
    )
on conflict (id) do nothing;

insert into public.photos (
    id, collection_id, title, alt, src, full_src, srcset,
    category, location, shot_at, sort_order, width, height
)
values
    (
        'portrait-001', 'portrait', 'A rain-darkened window frames trees and a passing car',
        'A rain-darkened window frames trees and a passing car',
        'images/portrait/portrait-01-1200.webp', 'images/portrait/portrait-01-1800.webp',
        'images/portrait/portrait-01-640.webp 640w, images/portrait/portrait-01-1200.webp 1200w, images/portrait/portrait-01-1800.webp 1800w',
        'portrait', '', null, 1, 1200, 1800
    ),
    (
        'portrait-002', 'portrait', 'Rain and trees seen through a softly lit window',
        'Rain and trees seen through a softly lit window',
        'images/portrait/portrait-02-1200.webp', 'images/portrait/portrait-02-1800.webp',
        'images/portrait/portrait-02-640.webp 640w, images/portrait/portrait-02-1200.webp 1200w, images/portrait/portrait-02-1800.webp 1800w',
        'portrait', '', null, 2, 1200, 1800
    ),
    (
        'portrait-003', 'portrait', 'A glowing wall lamp beside a rain-covered garden window',
        'A glowing wall lamp beside a rain-covered garden window',
        'images/portrait/portrait-03-1200.webp', 'images/portrait/portrait-03-1800.webp',
        'images/portrait/portrait-03-640.webp 640w, images/portrait/portrait-03-1200.webp 1200w, images/portrait/portrait-03-1800.webp 1800w',
        'portrait', '', null, 3, 1200, 1800
    ),
    (
        'documentary-001', 'documentary', 'White flowers and a veiled mannequin beside an old window',
        'White flowers and a veiled mannequin beside an old window',
        'images/documentary/documentary-01-1200.webp', 'images/documentary/documentary-01-1800.webp',
        'images/documentary/documentary-01-640.webp 640w, images/documentary/documentary-01-1200.webp 1200w, images/documentary/documentary-01-1800.webp 1800w',
        'documentary', '', null, 4, 1200, 1800
    ),
    (
        'documentary-002', 'documentary', 'Plants and a chandelier in a weathered indoor courtyard',
        'Plants and a chandelier in a weathered indoor courtyard',
        'images/documentary/documentary-02-1200.webp', 'images/documentary/documentary-02-1800.webp',
        'images/documentary/documentary-02-640.webp 640w, images/documentary/documentary-02-1200.webp 1200w, images/documentary/documentary-02-1800.webp 1800w',
        'documentary', '', null, 5, 1200, 800
    ),
    (
        'documentary-003', 'documentary', 'Jewelry, mirrors and a painted hand arranged on a table',
        'Jewelry, mirrors and a painted hand arranged on a table',
        'images/documentary/documentary-03-1200.webp', 'images/documentary/documentary-03-1800.webp',
        'images/documentary/documentary-03-640.webp 640w, images/documentary/documentary-03-1200.webp 1200w, images/documentary/documentary-03-1800.webp 1800w',
        'documentary', '', null, 6, 1200, 800
    ),
    (
        'landscape-001', 'landscape', 'City lights beneath a pink dusk sky and silhouetted branches',
        'City lights beneath a pink dusk sky and silhouetted branches',
        'images/landscape/landscape-01-1200.webp', 'images/landscape/landscape-01-1800.webp',
        'images/landscape/landscape-01-640.webp 640w, images/landscape/landscape-01-1200.webp 1200w, images/landscape/landscape-01-1800.webp 1800w',
        'landscape', '', null, 7, 1200, 511
    ),
    (
        'landscape-002', 'landscape', 'Crescent moon above distant mountains in a purple evening sky',
        'Crescent moon above distant mountains in a purple evening sky',
        'images/landscape/landscape-02-1200.webp', 'images/landscape/landscape-02-1800.webp',
        'images/landscape/landscape-02-640.webp 640w, images/landscape/landscape-02-1200.webp 1200w, images/landscape/landscape-02-1800.webp 1800w',
        'landscape', '', null, 8, 1200, 1800
    ),
    (
        'landscape-003', 'landscape', 'Stone steps lead through a wooden gate framed by pink flowers',
        'Stone steps lead through a wooden gate framed by pink flowers',
        'images/landscape/landscape-03-1200.webp', 'images/landscape/landscape-03-1800.webp',
        'images/landscape/landscape-03-640.webp 640w, images/landscape/landscape-03-1200.webp 1200w, images/landscape/landscape-03-1800.webp 1800w',
        'landscape', '', null, 9, 1200, 600
    )
on conflict (id) do nothing;
