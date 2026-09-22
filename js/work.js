// ================================================================
// 首页 Work / Collections
// collections.js 决定卡片数量，现有 CSS 继续负责视觉和响应式布局。
// ================================================================

const collectionGrid = document.querySelector("#collection-grid");

function createWorkCard(collection) {
    const card = document.createElement("article");
    card.className = "project-card reveal";

    const link = document.createElement("a");
    link.className = "project-card-link";
    link.href = `collection.html?slug=${encodeURIComponent(collection.slug)}`;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "project-card-image";

    const image = document.createElement("img");
    image.src = collection.cover;
    image.alt = collection.coverAlt || `${collection.title} collection cover`;
    image.loading = "lazy";
    image.decoding = "async";

    if (collection.coverSrcset) {
        image.srcset = collection.coverSrcset;
        image.sizes = "(max-width: 768px) calc(100vw - 40px), calc((100vw - 120px) / 2)";
    }

    if (collection.coverWidth && collection.coverHeight) {
        image.width = collection.coverWidth;
        image.height = collection.coverHeight;
    }

    const overlay = document.createElement("span");
    overlay.className = "project-card-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.textContent = "View Project";

    imageWrapper.append(image, overlay);

    const info = document.createElement("div");
    info.className = "project-card-info";

    const title = document.createElement("h3");
    title.textContent = collection.title;

    const meta = document.createElement("div");
    meta.className = "project-card-meta";

    const type = document.createElement("span");
    type.textContent = "Collection";

    const photoCount = contentService.getPhotosByCollection(collection.id).length;
    const count = document.createElement("span");
    count.textContent = `${photoCount} ${photoCount === 1 ? "photograph" : "photographs"}`;

    meta.append(type, count);
    info.append(title, meta);
    link.append(imageWrapper, info);
    card.appendChild(link);

    return card;
}

function renderWorks(collectionList) {
    if (!collectionGrid) return;

    if (collectionList.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = "No collections found.";
        collectionGrid.replaceChildren(emptyMessage);
        return;
    }

    const fragment = document.createDocumentFragment();

    collectionList.forEach((collection) => {
        fragment.appendChild(createWorkCard(collection));
    });

    collectionGrid.replaceChildren(fragment);
}

renderWorks(contentService.getCollections());
