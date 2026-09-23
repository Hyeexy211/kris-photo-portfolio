// Generate static metadata for the nine published seed photo IDs.
// Cloud mode refreshes their public metadata after an Admin edit.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const baseUrl = "https://hyeexy211.github.io/kris-photo-portfolio/";
const source = fs.readFileSync(path.join(root, "data/photos.js"), "utf8");
const seedPhotos = vm.runInNewContext(`${source}\ndefaultPhotos`, {}, { timeout: 1000 });
const template = fs.readFileSync(path.join(root, "photo.html"), "utf8");
const outputDir = path.join(root, "photos");
const mode = process.argv[2] || "--source=seed";

if (!["--source=seed", "--source=supabase"].includes(mode) || process.argv.length > 3) {
    throw new Error("Use --source=seed or --source=supabase.");
}

async function loadPhotos() {
    if (mode === "--source=seed") return seedPhotos;

    const configSource = fs.readFileSync(path.join(root, "js/config/data-source.js"), "utf8");
    const config = vm.runInNewContext(`${configSource}\nCONTENT_DATA_SOURCE`, {}, { timeout: 1000 });
    const { url, publishableKey } = config.supabase;
    if (!url.startsWith("https://") || !publishableKey.startsWith("sb_publishable_")) {
        throw new Error("A public Supabase URL and publishable key are required.");
    }

    const endpoint = new URL("rest/v1/photos", `${url}/`);
    endpoint.searchParams.set("select", "*");
    endpoint.searchParams.set("id", `in.(${seedPhotos.map((photo) => photo.id).join(",")})`);
    const response = await fetch(endpoint, {
        headers: { apikey: publishableKey },
        signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`Supabase public photo read failed: HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Supabase did not return a photo list.");
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    return seedPhotos.map((seed) => {
        const row = rowsById.get(seed.id);
        if (!row) throw new Error(`Published seed photo missing from Supabase: ${seed.id}`);
        return {
            ...seed,
            title: row.title || row.alt || seed.title,
            alt: row.alt || row.title || seed.title,
            description: row.description || "",
            src: row.src,
            fullSrc: row.full_src || row.src,
            width: row.width,
            height: row.height
        };
    });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function replaceOnce(html, previous, next) {
    if (!html.includes(previous)) throw new Error(`Template marker missing: ${previous}`);
    return html.replace(previous, next);
}

function renderPhoto(photo) {
    if (!/^[a-z0-9-]+$/.test(photo.id)) throw new Error(`Invalid photo ID: ${photo.id}`);
    for (const imagePath of [photo.src, photo.fullSrc]) {
        if (typeof imagePath !== "string" || !imagePath) throw new Error(`Missing image path for ${photo.id}`);
        if (/^https:\/\//.test(imagePath)) continue;
        if (!/^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/i.test(imagePath)
            || !fs.existsSync(path.join(root, imagePath))) {
            throw new Error(`Missing or invalid local image: ${imagePath}`);
        }
    }

    const title = photo.title || "Untitled photograph";
    const description = photo.description || title;
    const alt = photo.alt || title;
    const pageUrl = new URL(`photos/${photo.id}.html`, baseUrl).href;
    const imageUrl = new URL(photo.fullSrc || photo.src, baseUrl).href;
    const imageObject = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        name: title,
        description,
        contentUrl: new URL(photo.src, baseUrl).href,
        url: pageUrl
    };
    if (Number.isInteger(photo.width) && photo.width > 0) imageObject.width = photo.width;
    if (Number.isInteger(photo.height) && photo.height > 0) imageObject.height = photo.height;
    imageObject.creator = { "@type": "Person", name: "Kris Huang" };
    const displaySrc = /^https:\/\//.test(photo.src) ? photo.src : `../${photo.src}`;
    const dimensions = Number.isInteger(photo.width) && Number.isInteger(photo.height)
        && photo.width > 0 && photo.height > 0
        ? ` width="${photo.width}" height="${photo.height}"`
        : "";
    let html = template.replace(/\b(href|src)="(images\/|css\/|js\/|data\/|index\.html)/g, '$1="../$2');
    html = replaceOnce(html, "<title>Photograph | Kris Photography</title>",
        `<title>${escapeHtml(title)} | Kris Photography</title>`);
    html = replaceOnce(html, '<meta name="description" content="A photograph by Kris Huang.">',
        `<meta name="description" content="${escapeHtml(description)}">`);
    html = replaceOnce(html,
        '<link rel="canonical" href="https://hyeexy211.github.io/kris-photo-portfolio/photo.html">',
        `<link rel="canonical" href="${pageUrl}">`);
    html = replaceOnce(html, '<meta property="og:title" content="Photograph | Kris Photography">',
        `<meta property="og:title" content="${escapeHtml(title)} | Kris Photography">`);
    html = replaceOnce(html, '<meta property="og:description" content="A photograph by Kris Huang.">',
        `<meta property="og:description" content="${escapeHtml(description)}">`);
    html = replaceOnce(html, '<meta property="og:type" content="website">',
        '<meta property="og:type" content="article">');
    html = replaceOnce(html,
        '<meta property="og:image" content="https://hyeexy211.github.io/kris-photo-portfolio/images/social/social-cover.png">',
        `<meta property="og:image" content="${escapeHtml(imageUrl)}">\n    <meta property="og:image:alt" content="${escapeHtml(alt)}">\n    <meta property="og:url" content="${pageUrl}">\n    <meta name="twitter:card" content="summary_large_image">\n    <script type="application/ld+json">${JSON.stringify(imageObject).replace(/</g, "\\u003c")}</script>`);
    html = replaceOnce(html, '<body class="project-site photo-page">',
        `<body class="project-site photo-page" data-photo-id="${photo.id}">`);
    html = replaceOnce(html, '<h1 id="photo-title">Loading photograph…</h1>',
        `<h1 id="photo-title">${escapeHtml(title)}</h1>`);
    html = replaceOnce(html,
        '<section class="project-gallery" id="photo-content" aria-label="Photograph" aria-busy="true"></section>',
        `<section class="project-gallery" id="photo-content" aria-label="Photograph" aria-busy="true"><figure class="project-image"><img src="${escapeHtml(displaySrc)}" alt="${escapeHtml(alt)}"${dimensions}></figure></section>`);

    return html;
}

async function main() {
    const photos = await loadPhotos();
    const pages = photos.map((photo) => ({ id: photo.id, html: renderPhoto(photo) }));
    fs.mkdirSync(outputDir, { recursive: true });
    pages.forEach(({ id, html }) => fs.writeFileSync(path.join(outputDir, `${id}.html`), html));
    console.log(`Generated ${pages.length} static photo pages from ${mode.slice(9)}.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
