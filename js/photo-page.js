const photoTitle = document.querySelector("#photo-title");
const photoCategory = document.querySelector("#photo-category");
const photoDescription = document.querySelector("#photo-description");
const photoContent = document.querySelector("#photo-content");
const photoInfo = document.querySelector("#photo-info");
const photoPageScript = document.querySelector('script[src$="photo-page.js"]');
const photoSiteRoot = new URL("../", photoPageScript.src);
let currentPhoto = null;
let currentPhotoCollections = [];
let photoPageState = "loading";

function resolvePhotoAsset(assetPath) {
    return new URL(assetPath, photoSiteRoot).href;
}

function createWebDownload(photo) {
    if (!/^[a-z0-9-]+$/.test(photo.id)
        || !/^images\/[a-z0-9-]+\/[a-z0-9-]+-1200\.webp$/.test(photo.src)) {
        return null;
    }

    const link = document.createElement("a");
    link.className = "photo-download";
    link.href = resolvePhotoAsset(photo.src);
    link.download = `kris-${photo.id}-web.webp`;
    link.textContent = siteI18n.t("photo.downloadWebSize");
    return link;
}

function createPhotoInfo(labelText, valueText) {
    const item = document.createElement("div");
    const label = document.createElement("p");
    const value = document.createElement("p");
    label.className = "project-info-label";
    label.textContent = labelText;
    value.textContent = valueText;
    item.append(label, value);
    return item;
}

function setPhotoMetadata(title, description, pageTitle = siteI18n.t("seo.photoPageTitle", { title })) {
    const titleElement = document.querySelector("title");
    if (titleElement) titleElement.removeAttribute("data-i18n");
    document.title = pageTitle;

    const metadata = {
        'meta[name="description"]': description,
        'meta[property="og:title"]': pageTitle,
        'meta[property="og:description"]': description,
        'meta[name="twitter:title"]': pageTitle,
        'meta[name="twitter:description"]': description
    };

    Object.entries(metadata).forEach(([selector, value]) => {
        const meta = document.querySelector(selector);
        if (meta) {
            meta.removeAttribute("data-i18n-content");
            meta.content = value;
        }
    });
}

function refreshPhotoLanguage() {
    if (photoPageState === "loading") {
        if (!document.body.dataset.photoId) {
            photoTitle.removeAttribute("data-i18n");
            photoTitle.textContent = siteI18n.t("photo.loading");
        }
        photoCategory.removeAttribute("data-i18n");
        photoCategory.textContent = siteI18n.t("photo.photograph");
        photoContent.removeAttribute("data-i18n-aria-label");
        photoContent.setAttribute("aria-label", siteI18n.t("photo.photograph"));
        return;
    }

    photoTitle.removeAttribute("data-i18n");
    photoCategory.removeAttribute("data-i18n");
    photoContent.removeAttribute("data-i18n-aria-label");

    if (photoPageState === "notFound") {
        const title = siteI18n.t("photo.notFound");
        const message = siteI18n.t("photo.notFoundHelp");
        setPhotoMetadata(title, message, siteI18n.t("seo.photoNotFoundTitle"));
        photoTitle.textContent = title;
        photoContent.textContent = message;
        photoContent.setAttribute("aria-label", siteI18n.t("photo.photograph"));
        return;
    }

    if (photoPageState === "error") {
        const title = siteI18n.t("photo.unavailable");
        const message = siteI18n.t("photo.errorHelp");
        setPhotoMetadata(title, message, siteI18n.t("seo.photoErrorTitle"));
        photoTitle.textContent = title;
        photoContent.textContent = message;
        photoContent.setAttribute("aria-label", siteI18n.t("photo.photograph"));
        return;
    }

    const photo = currentPhoto;
    const title = siteI18n.content(photo, "title")
        || siteI18n.content(photo, "alt")
        || siteI18n.t("photo.untitled");
    const description = siteI18n.content(photo, "description");
    setPhotoMetadata(title, description || title);
    photoTitle.textContent = title;
    photoCategory.textContent = photo.category
        ? siteI18n.category(photo.category)
        : siteI18n.t("photo.photograph");
    photoDescription.textContent = description;
    photoDescription.hidden = !description;
    photoContent.setAttribute("aria-label", siteI18n.t("photo.photograph"));

    const image = photoContent.querySelector("img");
    const alt = siteI18n.content(photo, "alt") || title;
    if (image) image.alt = alt;
    const openGraphImageAlt = document.querySelector('meta[property="og:image:alt"]');
    if (openGraphImageAlt) openGraphImageAlt.content = alt;

    const downloadLink = photoContent.querySelector(".photo-download");
    if (downloadLink) downloadLink.textContent = siteI18n.t("photo.downloadWebSize");

    const details = [createPhotoInfo(siteI18n.t("photo.photograph"), title)];
    const collection = currentPhotoCollections.find((item) => item.id === photo.collectionId);
    if (collection) {
        details.push(createPhotoInfo(siteI18n.t("work.collection"), siteI18n.content(collection, "title")));
    }
    const optionalFields = [
        ["date", "photo.captureDate"],
        ["captureTime", "photo.captureTime"],
        ["location", "photo.location"],
        ["camera", "photo.camera"],
        ["lens", "photo.lens"],
        ["focalLength", "photo.focalLength"],
        ["aperture", "photo.aperture"],
        ["shutterSpeed", "photo.shutterSpeed"],
        ["iso", "photo.iso"]
    ];
    optionalFields.forEach(([field, key]) => {
        const value = siteI18n.content(photo, field);
        if (value) details.push(createPhotoInfo(siteI18n.t(key), value));
    });
    const tags = siteI18n.content(photo, "tags");
    if (Array.isArray(tags) && tags.length) {
        details.push(createPhotoInfo(siteI18n.t("photo.tags"), tags.join(", ")));
    }
    photoInfo.replaceChildren(...details);
}

async function renderPhotoPage() {
    const id = document.body.dataset.photoId
        || new URLSearchParams(window.location.search).get("id");
    refreshPhotoLanguage();

    try {
        const [photos, collections] = await Promise.all([
            contentService.getPhotos(),
            contentService.getCollections()
        ]);
        const photo = photos.find((item) => item.id === id);

        if (!photo) {
            photoPageState = "notFound";
            refreshPhotoLanguage();
            return;
        }

        currentPhoto = photo;
        currentPhotoCollections = collections;
        const title = siteI18n.content(photo, "title")
            || siteI18n.content(photo, "alt")
            || siteI18n.t("photo.untitled");

        const image = document.createElement("img");
        image.src = resolvePhotoAsset(photo.fullSrc || photo.src);
        image.alt = siteI18n.content(photo, "alt") || title;
        image.decoding = "async";
        if (photo.srcset) {
            image.srcset = photo.srcset.split(",").map((candidate) => {
                const [assetPath, descriptor] = candidate.trim().split(/\s+/, 2);
                return `${resolvePhotoAsset(assetPath)} ${descriptor}`;
            }).join(", ");
            image.sizes = "(max-width: 768px) calc(100vw - 40px), calc(100vw - 96px)";
        }
        if (photo.width && photo.height) {
            image.width = photo.width;
            image.height = photo.height;
        }
        const figure = document.createElement("figure");
        figure.className = "project-image";
        figure.appendChild(image);
        const downloadLink = createWebDownload(photo);
        photoContent.replaceChildren(...(downloadLink ? [figure, downloadLink] : [figure]));
        photoPageState = "ready";
        refreshPhotoLanguage();

        const canonicalUrl = document.body.dataset.photoId
            ? new URL(window.location.pathname, window.location.origin)
            : new URL(`photo.html?id=${encodeURIComponent(photo.id)}`, window.location.href);
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = canonicalUrl.href;
    } catch (error) {
        console.error("Unable to load this photograph.", error);
        photoPageState = "error";
        refreshPhotoLanguage();
    } finally {
        photoContent.removeAttribute("aria-busy");
    }
}

renderPhotoPage();
siteI18n.onChange(refreshPhotoLanguage);
