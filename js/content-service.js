// ================================================================
// Content Service
// 页面与 Admin 只通过这里读取或修改内容，不直接访问 localStorage。
// Work 沿用项目现有的 Collection 数据结构，Gallery Item 沿用 Photo。
// ================================================================

function cloneContent(data) {
    return JSON.parse(JSON.stringify(data));
}

function createContentId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadContentArray(key, defaultData) {
    const storedData = storageService.loadData(key);

    if (Array.isArray(storedData)) return storedData;

    // localStorage 不可用或内容在页面运行期间损坏时，公共页面仍显示默认内容。
    return cloneContent(defaultData);
}

function initializeContentArray(key, defaultData) {
    const storedData = storageService.loadData(key);

    // 合法空数组表示用户确实删除了全部内容，不能重新写入默认数据。
    if (Array.isArray(storedData)) return;

    // key 缺失、JSON 损坏或数据类型错误时，用对应种子恢复一个可用状态。
    storageService.saveData(key, cloneContent(defaultData));
}

function initializeContent() {
    initializeContentArray(STORAGE_KEYS.WORKS, defaultCollections);
    initializeContentArray(STORAGE_KEYS.GALLERY, defaultPhotos);
}

function getWorks() {
    return loadContentArray(STORAGE_KEYS.WORKS, defaultCollections).sort((workA, workB) => {
        const orderA = Number.isFinite(workA.order) ? workA.order : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(workB.order) ? workB.order : Number.MAX_SAFE_INTEGER;

        return orderA - orderB;
    });
}

function getGalleryItems() {
    return loadContentArray(STORAGE_KEYS.GALLERY, defaultPhotos);
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

    return storageService.saveData(STORAGE_KEYS.WORKS, works) ? createdWork : null;
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

    return storageService.saveData(STORAGE_KEYS.WORKS, works) ? updatedWork : null;
}

function deleteWork(id) {
    const works = getWorks();
    const nextWorks = works.filter((work) => work.id !== id);

    if (nextWorks.length === works.length) return false;

    return storageService.saveData(STORAGE_KEYS.WORKS, nextWorks);
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

    return storageService.saveData(STORAGE_KEYS.GALLERY, galleryItems) ? createdItem : null;
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

    galleryItems[itemIndex] = updatedItem;

    return storageService.saveData(STORAGE_KEYS.GALLERY, galleryItems) ? updatedItem : null;
}

function deleteGalleryItem(id) {
    const galleryItems = getGalleryItems();
    const nextItems = galleryItems.filter((item) => item.id !== id);

    if (nextItems.length === galleryItems.length) return false;

    return storageService.saveData(STORAGE_KEYS.GALLERY, nextItems);
}

function resetWorks() {
    return storageService.saveData(STORAGE_KEYS.WORKS, cloneContent(defaultCollections));
}

function resetGallery() {
    return storageService.saveData(STORAGE_KEYS.GALLERY, cloneContent(defaultPhotos));
}

function resetAllContent() {
    const worksReset = resetWorks();
    const galleryReset = resetGallery();

    return worksReset && galleryReset;
}

// 入口脚本在读取内容前先完成安全初始化；有效数组（包括 []）不会被覆盖。
initializeContent();

const contentService = Object.freeze({
    initializeContent,
    getWorks,
    getCollections: getWorks,
    getWorkById(id) {
        return getWorks().find((work) => work.id === id) || null;
    },
    getCollectionById(id) {
        return getWorks().find((work) => work.id === id) || null;
    },
    getCollectionBySlug(slug) {
        return getWorks().find((work) => work.slug === slug) || null;
    },
    createWork,
    updateWork,
    deleteWork,
    getGalleryItems,
    getPhotos: getGalleryItems,
    getGalleryItemById(id) {
        return getGalleryItems().find((item) => item.id === id) || null;
    },
    getPhotosByCollection(collectionId) {
        return getGalleryItems().filter((item) => item.collectionId === collectionId);
    },
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    resetWorks,
    resetGallery,
    resetAllContent
});
