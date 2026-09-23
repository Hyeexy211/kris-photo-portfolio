// ================================================================
// Lesson 34: Homepage Work / Collections
// The page awaits Content Service and never depends on Supabase directly.
// ================================================================

const collectionGrid = document.querySelector("#collection-grid");

function createWorkState(message) {
    const state = document.createElement("p");
    state.className = "gallery-empty";
    state.textContent = message;
    return state;
}

function createWorkCard(collection, photoCount) {
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

    const count = document.createElement("span");
    count.textContent = `${photoCount} ${photoCount === 1 ? "photograph" : "photographs"}`;

    meta.append(type, count);
    info.append(title, meta);
    link.append(imageWrapper, info);
    card.appendChild(link);

    return card;
}

function renderWorks(collectionList, photoList) {
    if (!collectionGrid) return;

    if (collectionList.length === 0) {
        collectionGrid.replaceChildren(createWorkState("No collections found."));
        return;
    }

    const fragment = document.createDocumentFragment();

    collectionList.forEach((collection) => {
        const photoCount = photoList.filter((photo) => photo.collectionId === collection.id).length;
        fragment.appendChild(createWorkCard(collection, photoCount));
    });

    collectionGrid.replaceChildren(fragment);
}

async function initWorks() {
    if (!collectionGrid) return;

    collectionGrid.setAttribute("aria-busy", "true");
    collectionGrid.replaceChildren(createWorkState("Loading collections…"));

    try {
        const [collections, photos] = await Promise.all([
            contentService.getCollections(),
            contentService.getPhotos()
        ]);

        renderWorks(collections, photos);
        if (typeof observeRevealElements === "function") observeRevealElements(collectionGrid);
    } catch (error) {
        console.error("Unable to load collections.", error);
        collectionGrid.replaceChildren(createWorkState("Unable to load collections."));
    } finally {
        collectionGrid.removeAttribute("aria-busy");
    }
}

initWorks();
