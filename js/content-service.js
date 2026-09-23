// ================================================================
// Lesson 34: Content Service
// Public pages read through this service without knowing which repository is active.
// Browser-local Admin writes still use the local repository.
// ================================================================

let contentReadPromise = null;

function createContentId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useSupabaseDataSource() {
    return CONTENT_DATA_SOURCE.source === "supabase";
}

async function readPublicContent() {
    if (!useSupabaseDataSource()) {
        return {
            collections: localRepository.getCollections(),
            photos: localRepository.getPhotos()
        };
    }

    try {
        const [collections, photos] = await Promise.all([
            supabaseRepository.getCollections(),
            supabaseRepository.getPhotos()
        ]);
        return { collections, photos };
    } catch (error) {
        if (!CONTENT_DATA_SOURCE.fallbackToLocal) throw error;

        console.warn(
            "Supabase content read failed; using both browser-local tables instead.",
            error
        );

        return {
            collections: localRepository.getCollections(),
            photos: localRepository.getPhotos()
        };
    }
}

function getPublicContent() {
    if (!contentReadPromise) contentReadPromise = readPublicContent();
    return contentReadPromise;
}

function getCollections() {
    return getPublicContent().then((content) => content.collections);
}

function getPhotos() {
    return getPublicContent().then((content) => content.photos);
}

async function getCollectionById(id) {
    const collections = await getCollections();
    return collections.find((collection) => collection.id === id) || null;
}

async function getCollectionBySlug(slug) {
    const collections = await getCollections();
    return collections.find((collection) => collection.slug === slug) || null;
}

async function getPhotosByCollection(collectionId) {
    const photos = await getPhotos();
    return photos
        .filter((photo) => photo.collectionId === collectionId)
        .sort((photoA, photoB) => {
            const orderA = Number.isFinite(photoA.collectionOrder)
                ? photoA.collectionOrder : Number.MAX_SAFE_INTEGER;
            const orderB = Number.isFinite(photoB.collectionOrder)
                ? photoB.collectionOrder : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
}

// The methods below preserve Lesson 33's browser-local Admin prototype.
function getWorks() {
    return localRepository.getCollections();
}

function getGalleryItems() {
    return localRepository.getPhotos();
}

function createWork(workData) {
    const works = getWorks();
    const timestamp = new Date().toISOString();
    const createdWork = {
        ...workData,
        id: workData.id || createContentId("work"),
        createdAt: workData.createdAt || timestamp,
        updatedAt: timestamp
    };

    works.push(createdWork);

    return localRepository.saveCollections(works) ? createdWork : null;
}

function updateWork(id, updates) {
    const works = getWorks();
    const workIndex = works.findIndex((work) => work.id === id);

    if (workIndex === -1) return null;

    const updatedWork = {
        ...works[workIndex],
        ...updates,
        id: works[workIndex].id,
        updatedAt: new Date().toISOString()
    };

    works[workIndex] = updatedWork;

    return localRepository.saveCollections(works) ? updatedWork : null;
}

function deleteWork(id) {
    const works = getWorks();
    const nextWorks = works.filter((work) => work.id !== id);

    if (nextWorks.length === works.length) return false;

    const photos = getGalleryItems();
    if (!photos.some((photo) => photo.collectionId === id)) {
        return localRepository.saveCollections(nextWorks);
    }

    const updatedAt = new Date().toISOString();
    const detachedPhotos = photos.map((photo) => photo.collectionId === id
        ? { ...photo, collectionId: null, collectionOrder: null, updatedAt }
        : photo);

    // Keep the Collection if its photos cannot first be detached.
    if (!localRepository.savePhotos(detachedPhotos)) return false;
    if (localRepository.saveCollections(nextWorks)) return true;

    // A failed Collection write leaves it in place. Restore its photo links when possible.
    localRepository.savePhotos(photos);
    return false;
}

function createGalleryItem(itemData) {
    const galleryItems = getGalleryItems();
    const timestamp = new Date().toISOString();
    const createdItem = {
        ...itemData,
        id: itemData.id || createContentId("photo"),
        createdAt: itemData.createdAt || timestamp,
        updatedAt: timestamp
    };

    galleryItems.push(createdItem);

    return localRepository.savePhotos(galleryItems) ? createdItem : null;
}

function updateGalleryItem(id, updates) {
    const galleryItems = getGalleryItems();
    const itemIndex = galleryItems.findIndex((item) => item.id === id);

    if (itemIndex === -1) return null;

    const updatedItem = {
        ...galleryItems[itemIndex],
        ...updates,
        id: galleryItems[itemIndex].id,
        updatedAt: new Date().toISOString()
    };

    if (Object.prototype.hasOwnProperty.call(updates, "collectionId")
        && !Object.prototype.hasOwnProperty.call(updates, "collectionOrder")) {
        updatedItem.collectionOrder = null;
    }
    if (!updatedItem.collectionId) updatedItem.collectionOrder = null;

    galleryItems[itemIndex] = updatedItem;

    return localRepository.savePhotos(galleryItems) ? updatedItem : null;
}

function deleteGalleryItem(id) {
    const galleryItems = getGalleryItems();
    const nextItems = galleryItems.filter((item) => item.id !== id);

    if (nextItems.length === galleryItems.length) return false;

    return localRepository.savePhotos(nextItems);
}

function resetWorks() {
    return localRepository.resetCollections();
}

function resetGallery() {
    return localRepository.resetPhotos();
}

function resetAllContent() {
    const worksReset = resetWorks();
    const galleryReset = resetGallery();

    return worksReset && galleryReset;
}

localRepository.initialize();

const contentService = Object.freeze({
    getCollections,
    getPhotos,
    getCollectionById,
    getCollectionBySlug,
    getPhotosByCollection,

    // Browser-local Admin API retained for Lesson 33 compatibility.
    getWorks,
    getWorkById(id) {
        return getWorks().find((work) => work.id === id) || null;
    },
    createWork,
    updateWork,
    deleteWork,
    getGalleryItems,
    getGalleryItemById(id) {
        return getGalleryItems().find((item) => item.id === id) || null;
    },
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    resetWorks,
    resetGallery,
    resetAllContent
});
