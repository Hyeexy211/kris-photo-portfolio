// ================================================================
// Lesson 34: Homepage Work / Collections
// The page awaits Content Service and never depends on Supabase directly.
// ================================================================

const collectionGrid = document.querySelector("#collection-grid");
let workCollections = [];
let workPhotos = [];
let workState = "loading";

function workPhotoCount(count) {
    return siteI18n.t(count === 1 ? "work.photoCountOne" : "work.photoCountOther", { count });
}

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
    image.alt = siteI18n.content(collection, "coverAlt")
        || siteI18n.t("work.coverAlt", { title: siteI18n.content(collection, "title") });
    image.loading = "lazy";
    image.decoding = "async";
    const imageFallback = document.createElement("span");
    imageFallback.className = "project-card-image-fallback";
    imageFallback.textContent = siteI18n.content(collection, "title");
    imageFallback.hidden = Boolean(collection.cover);
    image.hidden = !collection.cover;
    if (collection.cover) {
        image.src = collection.cover;
        image.addEventListener("error", () => {
            image.hidden = true;
            imageFallback.hidden = false;
        });
    }

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
    overlay.textContent = siteI18n.t("work.viewProject");

    imageWrapper.append(image, imageFallback, overlay);

    const info = document.createElement("div");
    info.className = "project-card-info";

    const title = document.createElement("h3");
    title.textContent = siteI18n.content(collection, "title");

    const meta = document.createElement("div");
    meta.className = "project-card-meta";

    const type = document.createElement("span");
    type.textContent = siteI18n.t("work.collection");

    const count = document.createElement("span");
    count.textContent = workPhotoCount(photoCount);

    meta.append(type, count);
    info.append(title, meta);
    link.append(imageWrapper, info);
    card.appendChild(link);

    return card;
}

function updateWorkCardLanguage(card, collection, photoCount) {
    card.querySelector(".project-card-image img").alt = siteI18n.content(collection, "coverAlt")
        || siteI18n.t("work.coverAlt", { title: siteI18n.content(collection, "title") });
    card.querySelector(".project-card-image-fallback").textContent = siteI18n.content(collection, "title");
    card.querySelector(".project-card-overlay").textContent = siteI18n.t("work.viewProject");
    card.querySelector(".project-card-info h3").textContent = siteI18n.content(collection, "title");
    const [type, count] = card.querySelectorAll(".project-card-meta span");
    type.textContent = siteI18n.t("work.collection");
    count.textContent = workPhotoCount(photoCount);
}

function refreshWorkLanguage() {
    if (!collectionGrid) return;

    const stateKeys = {
        loading: "work.loading",
        empty: "work.empty",
        error: "work.error"
    };
    if (stateKeys[workState]) {
        const message = collectionGrid.querySelector(".gallery-empty");
        if (message) message.textContent = siteI18n.t(stateKeys[workState]);
        return;
    }

    const cards = collectionGrid.querySelectorAll(".project-card");
    workCollections.forEach((collection, index) => {
        const photoCount = workPhotos.filter((photo) => photo.collectionId === collection.id).length;
        if (cards[index]) updateWorkCardLanguage(cards[index], collection, photoCount);
    });
}

function renderWorks(collectionList, photoList) {
    if (!collectionGrid) return;

    if (collectionList.length === 0) {
        workState = "empty";
        collectionGrid.replaceChildren(createWorkState(siteI18n.t("work.empty")));
        return;
    }

    const fragment = document.createDocumentFragment();

    collectionList.forEach((collection) => {
        const photoCount = photoList.filter((photo) => photo.collectionId === collection.id).length;
        fragment.appendChild(createWorkCard(collection, photoCount));
    });

    collectionGrid.replaceChildren(fragment);
    workState = "ready";
}

async function initWorks() {
    if (!collectionGrid) return;

    collectionGrid.setAttribute("aria-busy", "true");
    workState = "loading";
    collectionGrid.replaceChildren(createWorkState(siteI18n.t("work.loading")));

    try {
        const [collections, photos] = await Promise.all([
            contentService.getCollections(),
            contentService.getPhotos()
        ]);

        workCollections = collections;
        workPhotos = photos;
        renderWorks(collections, photos);
        if (typeof observeRevealElements === "function") observeRevealElements(collectionGrid);
    } catch (error) {
        console.error("Unable to load collections.", error);
        workState = "error";
        collectionGrid.replaceChildren(createWorkState(siteI18n.t("work.error")));
    } finally {
        collectionGrid.removeAttribute("aria-busy");
    }
}

initWorks();
siteI18n.onChange(refreshWorkLanguage);
