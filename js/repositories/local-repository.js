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

const LEGACY_COLLECTION_IDS = new Set(["portrait", "documentary", "landscape"]);
const LEGACY_PHOTO_IDS = new Set([
    "portrait-001", "portrait-002", "portrait-003",
    "documentary-001", "documentary-002", "documentary-003",
    "landscape-001", "landscape-002", "landscape-003"
]);

function migrateLegacyLocalContent() {
    if (storageService.loadData(STORAGE_KEYS.CONTENT_RESET_VERSION) === 1) return;

    const storedCollections = storageService.loadData(STORAGE_KEYS.WORKS);
    const storedPhotos = storageService.loadData(STORAGE_KEYS.GALLERY);
    const collections = Array.isArray(storedCollections)
        ? storedCollections.filter((item) => !LEGACY_COLLECTION_IDS.has(item.id)) : [];
    const photos = Array.isArray(storedPhotos)
        ? storedPhotos.filter((item) => !LEGACY_PHOTO_IDS.has(item.id)) : [];
    const existingCategories = storageService.loadData(STORAGE_KEYS.CATEGORIES);
    const categoryIds = new Set([...collections, ...photos]
        .map((item) => item.category).filter(Boolean));
    const categories = Array.isArray(existingCategories)
        ? existingCategories.filter((item) => categoryIds.has(item.id))
        : [...categoryIds].map((id) => ({ id, name: id }));

    if (!storageService.saveData(STORAGE_KEYS.WORKS, collections)
        || !storageService.saveData(STORAGE_KEYS.GALLERY, photos)
        || !storageService.saveData(STORAGE_KEYS.CATEGORIES, categories)) return;

    storageService.saveData(STORAGE_KEYS.CONTENT_RESET_VERSION, 1);
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
        migrateLegacyLocalContent();
        initializeLocalContentArray(STORAGE_KEYS.WORKS, defaultCollections);
        initializeLocalContentArray(STORAGE_KEYS.GALLERY, defaultPhotos);
        initializeLocalContentArray(STORAGE_KEYS.CATEGORIES, []);
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

    getCategories() {
        return loadLocalContentArray(STORAGE_KEYS.CATEGORIES, [])
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    createCategory(name) {
        const categories = this.getCategories();
        const trimmedName = name.trim();
        if (!trimmedName || categories.some((item) =>
            item.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
            throw new Error("Enter a unique category name.");
        }
        const created = { id: createContentId("category"), name: trimmedName };
        return storageService.saveData(STORAGE_KEYS.CATEGORIES, [...categories, created])
            ? created : null;
    },

    renameCategory(id, name) {
        const categories = this.getCategories();
        const trimmedName = name.trim();
        if (!trimmedName || categories.some((item) => item.id !== id
            && item.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
            throw new Error("Enter a unique category name.");
        }
        const original = categories.find((item) => item.id === id);
        if (!original) return null;
        const renamed = { ...original, name: trimmedName };
        return storageService.saveData(STORAGE_KEYS.CATEGORIES,
            categories.map((item) => item.id === id ? renamed : item)) ? renamed : null;
    },

    mergeCategories(sourceId, targetId) {
        if (sourceId === targetId) return false;
        const categories = this.getCategories();
        if (!categories.some((item) => item.id === sourceId)
            || !categories.some((item) => item.id === targetId)) return false;
        const collections = this.getCollections();
        const photos = this.getPhotos();
        const nextCollections = collections.map((item) => item.category === sourceId
            ? { ...item, category: targetId } : item);
        const nextPhotos = photos.map((item) => item.category === sourceId
            ? { ...item, category: targetId } : item);
        if (this.saveCollections(nextCollections) && this.savePhotos(nextPhotos)
            && storageService.saveData(STORAGE_KEYS.CATEGORIES,
                categories.filter((item) => item.id !== sourceId))) return true;
        this.saveCollections(collections);
        this.savePhotos(photos);
        storageService.saveData(STORAGE_KEYS.CATEGORIES, categories);
        return false;
    },

    deleteUnusedCategory(id) {
        if (this.getCollections().some((item) => item.category === id)
            || this.getPhotos().some((item) => item.category === id)) return false;
        const categories = this.getCategories();
        if (!categories.some((item) => item.id === id)) return false;
        return storageService.saveData(STORAGE_KEYS.CATEGORIES,
            categories.filter((item) => item.id !== id));
    },

    resetCollections() {
        return storageService.saveData(STORAGE_KEYS.WORKS, cloneLocalContent(defaultCollections));
    },

    resetPhotos() {
        return storageService.saveData(STORAGE_KEYS.GALLERY, cloneLocalContent(defaultPhotos));
    },

    resetCategories() {
        return storageService.saveData(STORAGE_KEYS.CATEGORIES, []);
    }
});
