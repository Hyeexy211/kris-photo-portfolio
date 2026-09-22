// ================================================================
// 通用 Collection 页面
// 例如 collection.html?slug=portrait 会读取 Portrait 及其关联照片。
// ================================================================

const collectionTitle = document.querySelector("#collection-title");
const collectionDescription = document.querySelector("#collection-description");
const collectionGallery = document.querySelector("#collection-gallery");
const collectionInfo = document.querySelector("#collection-info");

function createCollectionPhoto(photo, index) {
    const figure = document.createElement("figure");
    figure.className = "project-image";

    const button = document.createElement("button");
    button.className = "gallery-item lightbox-trigger";
    button.type = "button";
    button.dataset.fullSrc = photo.fullSrc || photo.src;
    button.setAttribute("aria-label", `Open ${photo.title || "photography work"}`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.title || "Photography work";
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";

    if (photo.srcset) {
        image.srcset = photo.srcset;
        image.sizes = "(max-width: 768px) calc(100vw - 40px), calc(100vw - 96px)";
    }

    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }

    button.appendChild(image);
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

function updateCollectionMetadata(collection) {
    const pageTitle = `${collection.title} | Kris Photography`;
    const liveUrl = `https://hyeexy211.github.io/kris-photo-portfolio/collection.html?slug=${encodeURIComponent(collection.slug)}`;
    const metadata = {
        'meta[name="description"]': collection.description,
        'meta[property="og:title"]': pageTitle,
        'meta[property="og:description"]': collection.description,
        'meta[property="og:url"]': liveUrl,
        'meta[name="twitter:title"]': pageTitle,
        'meta[name="twitter:description"]': collection.description
    };

    document.title = pageTitle;

    Object.entries(metadata).forEach(([selector, content]) => {
        const meta = document.querySelector(selector);
        if (meta) meta.content = content;
    });

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = liveUrl;
}

function renderCollectionPage() {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const collection = slug ? contentService.getCollectionBySlug(slug) : null;

    if (!collection) {
        document.title = "Collection Not Found | Kris Photography";
        collectionTitle.textContent = "Collection not found";
        collectionDescription.textContent = "Return to All work and choose an available collection.";
        collectionGallery.setAttribute("aria-label", "No collection photographs");
        collectionInfo.replaceChildren(createInfoItem("Status", "Not found"));
        return;
    }

    const collectionPhotos = contentService.getPhotosByCollection(collection.id);
    updateCollectionMetadata(collection);

    collectionTitle.textContent = collection.title;
    collectionDescription.textContent = collection.description;
    collectionGallery.setAttribute("aria-label", `${collection.title} photographs`);

    const galleryFragment = document.createDocumentFragment();
    collectionPhotos.forEach((photo, index) => {
        galleryFragment.appendChild(createCollectionPhoto(photo, index));
    });

    if (collectionPhotos.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = "No photos found.";
        galleryFragment.appendChild(emptyMessage);
    }

    collectionGallery.replaceChildren(galleryFragment);
    collectionInfo.replaceChildren(
        createInfoItem("Collection", collection.title),
        createInfoItem("Photographs", String(collectionPhotos.length)),
        createInfoItem("Photographer", "Kris Huang")
    );
}

renderCollectionPage();
