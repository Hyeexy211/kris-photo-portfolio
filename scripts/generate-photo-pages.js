// Generate static metadata for the nine published seed photos.
// New cloud-only photos continue to use photo.html?id=... until published here.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const baseUrl = "https://hyeexy211.github.io/kris-photo-portfolio/";
const source = fs.readFileSync(path.join(root, "data/photos.js"), "utf8");
const photos = vm.runInNewContext(`${source}\ndefaultPhotos`, {}, { timeout: 1000 });
const template = fs.readFileSync(path.join(root, "photo.html"), "utf8");
const outputDir = path.join(root, "photos");

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function replaceOnce(html, previous, next) {
    if (!html.includes(previous)) throw new Error(`Template marker missing: ${previous}`);
    return html.replace(previous, next);
}

fs.mkdirSync(outputDir, { recursive: true });

for (const photo of photos) {
    if (!/^[a-z0-9-]+$/.test(photo.id)) throw new Error(`Invalid photo ID: ${photo.id}`);
    for (const imagePath of [photo.src, photo.fullSrc]) {
        if (!fs.existsSync(path.join(root, imagePath))) throw new Error(`Missing image: ${imagePath}`);
    }

    const title = photo.title || "Untitled photograph";
    const pageUrl = new URL(`photos/${photo.id}.html`, baseUrl).href;
    const imageUrl = new URL(photo.fullSrc || photo.src, baseUrl).href;
    const imageObject = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        name: title,
        description: title,
        contentUrl: new URL(photo.src, baseUrl).href,
        url: pageUrl,
        width: photo.width,
        height: photo.height,
        creator: { "@type": "Person", name: "Kris Huang" }
    };
    let html = template.replace(/\b(href|src)="(images\/|css\/|js\/|data\/|index\.html)/g, '$1="../$2');
    html = replaceOnce(html, "<title>Photograph | Kris Photography</title>",
        `<title>${escapeHtml(title)} | Kris Photography</title>`);
    html = replaceOnce(html, '<meta name="description" content="A photograph by Kris Huang.">',
        `<meta name="description" content="${escapeHtml(title)}">`);
    html = replaceOnce(html,
        '<link rel="canonical" href="https://hyeexy211.github.io/kris-photo-portfolio/photo.html">',
        `<link rel="canonical" href="${pageUrl}">`);
    html = replaceOnce(html, '<meta property="og:title" content="Photograph | Kris Photography">',
        `<meta property="og:title" content="${escapeHtml(title)} | Kris Photography">`);
    html = replaceOnce(html, '<meta property="og:description" content="A photograph by Kris Huang.">',
        `<meta property="og:description" content="${escapeHtml(title)}">`);
    html = replaceOnce(html, '<meta property="og:type" content="website">',
        '<meta property="og:type" content="article">');
    html = replaceOnce(html,
        '<meta property="og:image" content="https://hyeexy211.github.io/kris-photo-portfolio/images/social/social-cover.png">',
        `<meta property="og:image" content="${imageUrl}">\n    <meta property="og:image:alt" content="${escapeHtml(title)}">\n    <meta property="og:url" content="${pageUrl}">\n    <meta name="twitter:card" content="summary_large_image">\n    <script type="application/ld+json">${JSON.stringify(imageObject).replace(/</g, "\\u003c")}</script>`);
    html = replaceOnce(html, '<body class="project-site photo-page">',
        `<body class="project-site photo-page" data-photo-id="${photo.id}">`);
    html = replaceOnce(html, '<h1 id="photo-title">Loading photograph…</h1>',
        `<h1 id="photo-title">${escapeHtml(title)}</h1>`);
    html = replaceOnce(html,
        '<section class="project-gallery" id="photo-content" aria-label="Photograph" aria-busy="true"></section>',
        `<section class="project-gallery" id="photo-content" aria-label="Photograph" aria-busy="true"><figure class="project-image"><img src="../${escapeHtml(photo.src)}" alt="${escapeHtml(title)}" width="${photo.width}" height="${photo.height}"></figure></section>`);

    fs.writeFileSync(path.join(outputDir, `${photo.id}.html`), html);
}

console.log(`Generated ${photos.length} static photo pages.`);
