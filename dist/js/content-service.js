// ================================================================
// Content Service
// 页面只通过这些函数读取内容。以后换成 localStorage 或数据库时，
// UI 不需要知道数据实际保存在哪里。
// ================================================================

const contentService = Object.freeze({
    getPhotos() {
        return [...photos];
    },

    getCollections() {
        return [...collections].sort((collectionA, collectionB) => {
            const orderA = Number.isFinite(collectionA.order) ? collectionA.order : Number.MAX_SAFE_INTEGER;
            const orderB = Number.isFinite(collectionB.order) ? collectionB.order : Number.MAX_SAFE_INTEGER;

            return orderA - orderB;
        });
    },

    getCollectionById(id) {
        return collections.find((collection) => collection.id === id) || null;
    },

    getCollectionBySlug(slug) {
        return collections.find((collection) => collection.slug === slug) || null;
    },

    getPhotosByCollection(collectionId) {
        return photos.filter((photo) => photo.collectionId === collectionId);
    }
});
