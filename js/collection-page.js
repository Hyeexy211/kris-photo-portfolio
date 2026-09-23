// ================================================================
// Lesson 34: 通用 Collection 页面
// 例如 collection.html?slug=portrait 会异步读取 Collection 及其关联照片。
// ================================================================

const collectionTitle = document.querySelector("#collection-title");
const collectionDescription = document.querySelector("#collection-description");
const collectionCover = document.querySelector("#collection-cover");
const collectionCoverImage = document.querySelector("#collection-cover-image");
const collectionStory = document.querySelector("#collection-story");
const collectionStoryText = document.querySelector("#collection-story-text");
const collectionGallery = document.querySelector("#collection-gallery");
const collectionInfo = document.querySelector("#collection-info");
let currentCollection = null;
let currentCollectionPhotos = [];
let collectionPageState = "loading";

function collectionPhotoLabel(photo) {
    return siteI18n.content(photo, "alt")
        || siteI18n.content(photo, "title")
        || siteI18n.t("gallery.photographyWork");
}

function createCollectionPhoto(photo, index) {
    const figure = document.createElement("figure");
    figure.className = "project-image";

    const button = document.createElement("button");
    button.className = "gallery-item lightbox-trigger";
    button.type = "button";
    button.dataset.fullSrc = photo.fullSrc || photo.src;
    button.dataset.id = photo.id;
    button.setAttribute("aria-label", siteI18n.t("gallery.openPhoto", { title: collectionPhotoLabel(photo) }));

    const image = document.createElement("img");
    image.alt = collectionPhotoLabel(photo);
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";
    const imageFallback = document.createElement("span");
    imageFallback.className = "gallery-image-fallback";
    imageFallback.textContent = collectionPhotoLabel(photo);
    imageFallback.hidden = Boolean(photo.src);
    image.hidden = !photo.src;
    if (photo.src) {
        image.src = photo.src;
        image.addEventListener("error", () => {
            image.hidden = true;
            imageFallback.hidden = false;
        });
    }

    if (photo.srcset) {
        image.srcset = photo.srcset;
        image.sizes = "(max-width: 768px) calc(100vw - 40px), calc(100vw - 96px)";
    }

    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }

    button.append(image, imageFallback);
    figure.appendChild(button);

    return figure;
}

function createInfoItem(labelText, valueText) {
    const item = document.createElement("div");
    const label = document.createElement("p");
    const value = document.createElement("p");

    label.className = "project-info-label";
    label.textContent = labelText;
    value.textContent = valueText;
    item.append(label, value);

    return item;
}

function setCollectionTextMetadata(title, description, pageTitle = siteI18n.t("seo.collectionPageTitle", { title })) {
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

    Object.entries(metadata).forEach(([selector, content]) => {
        const meta = document.querySelector(selector);
        if (meta) {
            meta.removeAttribute("data-i18n-content");
            meta.content = content;
        }
    });
}

function updateCollectionMetadata(collection) {
    const title = siteI18n.content(collection, "title");
    const description = siteI18n.content(collection, "description") || siteI18n.t("seo.collectionDescription");
    const liveUrl = `https://hyeexy211.github.io/kris-photo-portfolio/collection.html?slug=${encodeURIComponent(collection.slug)}`;
    setCollectionTextMetadata(title, description);

    const openGraphUrl = document.querySelector('meta[property="og:url"]');
    if (openGraphUrl) openGraphUrl.content = liveUrl;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = liveUrl;
}

function refreshCollectionLanguage() {
    collectionTitle.removeAttribute("data-i18n");
    collectionDescription.removeAttribute("data-i18n");
    collectionGallery.removeAttribute("data-i18n-aria-label");

    if (collectionPageState === "loading") {
        collectionCover.hidden = true;
        collectionStory.hidden = true;
        collectionTitle.textContent = siteI18n.t("work.collection");
        collectionDescription.textContent = siteI18n.t("work.loadingCollection");
        collectionGallery.setAttribute("aria-label", siteI18n.t("work.photographs"));
        return;
    }

    if (collectionPageState === "notFound") {
        collectionCover.hidden = true;
        collectionStory.hidden = true;
        const title = siteI18n.t("work.collectionNotFound");
        const description = siteI18n.t("work.collectionNotFoundHelp");
        setCollectionTextMetadata(title, description, siteI18n.t("seo.collectionNotFoundTitle"));
        collectionTitle.textContent = title;
        collectionDescription.textContent = description;
        collectionGallery.setAttribute("aria-label", siteI18n.t("work.noCollectionPhotographs"));
        collectionInfo.replaceChildren(createInfoItem(siteI18n.t("work.status"), siteI18n.t("work.notFound")));
        return;
    }

    if (collectionPageState === "error") {
        collectionCover.hidden = true;
        collectionStory.hidden = true;
        const title = siteI18n.t("work.collectionUnavailable");
        const description = siteI18n.t("work.collectionErrorHelp");
        setCollectionTextMetadata(title, description, siteI18n.t("seo.collectionErrorTitle"));
        collectionTitle.textContent = title;
        collectionDescription.textContent = description;
        collectionGallery.setAttribute("aria-label", siteI18n.t("work.collectionLoadingError"));
        collectionInfo.replaceChildren(createInfoItem(siteI18n.t("work.status"), siteI18n.t("work.unableToLoad")));
        return;
    }

    const title = siteI18n.content(currentCollection, "title");
    updateCollectionMetadata(currentCollection);
    collectionTitle.textContent = title;
    collectionDescription.textContent = siteI18n.content(currentCollection, "description");
    collectionCoverImage.alt = siteI18n.content(currentCollection, "coverAlt")
        || siteI18n.t("work.coverAlt", { title });
    const story = siteI18n.content(currentCollection, "story");
    collectionStoryText.textContent = story;
    collectionStory.hidden = !String(story).trim();
    collectionGallery.setAttribute("aria-label", siteI18n.t("work.collectionPhotographs", { title }));

    const buttons = collectionGallery.querySelectorAll(".lightbox-trigger");
    currentCollectionPhotos.forEach((photo, index) => {
        if (!buttons[index]) return;
        const label = collectionPhotoLabel(photo);
        buttons[index].setAttribute("aria-label", siteI18n.t("gallery.openPhoto", { title: label }));
        buttons[index].querySelector("img").alt = label;
        buttons[index].querySelector(".gallery-image-fallback").textContent = label;
    });

    if (currentCollectionPhotos.length === 0) {
        const emptyMessage = collectionGallery.querySelector(".gallery-empty");
        if (emptyMessage) emptyMessage.textContent = siteI18n.t("gallery.empty");
    }

    collectionInfo.replaceChildren(
        createInfoItem(siteI18n.t("work.collection"), title),
        createInfoItem(siteI18n.t("work.photographs"), String(currentCollectionPhotos.length)),
        createInfoItem(siteI18n.t("work.photographer"), "Kris Huang")
    );
}

async function renderCollectionPage() {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const collection = slug ? await contentService.getCollectionBySlug(slug) : null;

    if (!collection) {
        collectionPageState = "notFound";
        refreshCollectionLanguage();
        return;
    }

    const collectionPhotos = await contentService.getPhotosByCollection(collection.id);
    currentCollection = collection;
    currentCollectionPhotos = collectionPhotos;

    if (collection.cover) {
        collectionCoverImage.src = collection.cover;
        collectionCoverImage.decoding = "async";
        if (collection.coverSrcset) {
            collectionCoverImage.srcset = collection.coverSrcset;
            collectionCoverImage.sizes = "calc(100vw - 96px)";
        }
        if (collection.coverWidth && collection.coverHeight) {
            collectionCoverImage.width = collection.coverWidth;
            collectionCoverImage.height = collection.coverHeight;
        }
        collectionCover.hidden = false;
        collectionCoverImage.addEventListener("error", () => { collectionCover.hidden = true; }, { once: true });
    }

    const galleryFragment = document.createDocumentFragment();
    collectionPhotos.forEach((photo, index) => {
        galleryFragment.appendChild(createCollectionPhoto(photo, index));
    });

    if (collectionPhotos.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = siteI18n.t("gallery.empty");
        galleryFragment.appendChild(emptyMessage);
    }

    collectionGallery.replaceChildren(galleryFragment);
    collectionPageState = "ready";
    refreshCollectionLanguage();
}

async function initCollectionPage() {
    collectionGallery.setAttribute("aria-busy", "true");
    refreshCollectionLanguage();

    try {
        await renderCollectionPage();
    } catch (error) {
        console.error("Unable to load this collection.", error);
        collectionPageState = "error";
        refreshCollectionLanguage();
    } finally {
        collectionGallery.removeAttribute("aria-busy");
    }
}

// main.js waits for this promise before binding Lightbox to asynchronously created buttons.
window.collectionPageReady = initCollectionPage();
siteI18n.onChange(refreshCollectionLanguage);
