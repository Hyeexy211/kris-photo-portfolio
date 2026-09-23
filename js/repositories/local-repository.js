// ================================================================
// Lesson 34: Browser-local content repository
// This adapter is the only repository that knows how seed data maps to localStorage.
// ================================================================

function cloneLocalContent(data) {
    return JSON.parse(JSON.stringify(data));
}

function loadLocalContentArray(key, defaultData) {
    const storedData = storageService.loadData(key);

    if (Array.isArray(storedData)) return storedData;

    return cloneLocalContent(defaultData);
}

function initializeLocalContentArray(key, defaultData) {
    const storedData = storageService.loadData(key);

    // A valid empty array is intentional content and must not be replaced by seed data.
    if (Array.isArray(storedData)) return;

    storageService.saveData(key, cloneLocalContent(defaultData));
}

function sortLocalCollections(collections) {
    return [...collections].sort((collectionA, collectionB) => {
        const orderA = Number.isFinite(collectionA.order) ? collectionA.order : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(collectionB.order) ? collectionB.order : Number.MAX_SAFE_INTEGER;

        return orderA - orderB;
    });
}

function sortLocalPhotos(photos) {
    return [...photos].sort((photoA, photoB) => {
        const orderA = Number.isFinite(photoA.order) ? photoA.order : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(photoB.order) ? photoB.order : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
    });
}

const localRepository = Object.freeze({
    initialize() {
        initializeLocalContentArray(STORAGE_KEYS.WORKS, defaultCollections);
        initializeLocalContentArray(STORAGE_KEYS.GALLERY, defaultPhotos);
    },

    getCollections() {
        return sortLocalCollections(loadLocalContentArray(STORAGE_KEYS.WORKS, defaultCollections))
            .map((collection) => ({
                ...collection,
                story: typeof collection.story === "string" ? collection.story : ""
            }));
    },

    getPhotos() {
        const collectionPositions = new Map();

        return sortLocalPhotos(loadLocalContentArray(STORAGE_KEYS.GALLERY, defaultPhotos))
            .map((photo) => {
                const collectionId = photo.collectionId || null;
                let collectionOrder = null;

                if (collectionId) {
                    const position = (collectionPositions.get(collectionId) || 0) + 1;
                    collectionPositions.set(collectionId, position);
                    collectionOrder = Number.isFinite(photo.collectionOrder)
                        ? photo.collectionOrder : position;
                }

                return {
                    ...photo,
                    collectionId,
                    collectionOrder,
                    captureTime: typeof photo.captureTime === "string" ? photo.captureTime : ""
                };
            });
    },

    saveCollections(collections) {
        return storageService.saveData(STORAGE_KEYS.WORKS, collections);
    },

    savePhotos(photos) {
        return storageService.saveData(STORAGE_KEYS.GALLERY, photos);
    },

    resetCollections() {
        return storageService.saveData(STORAGE_KEYS.WORKS, cloneLocalContent(defaultCollections));
    },

    resetPhotos() {
        return storageService.saveData(STORAGE_KEYS.GALLERY, cloneLocalContent(defaultPhotos));
    }
});
