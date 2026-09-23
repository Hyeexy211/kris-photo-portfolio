// ================================================================
// Storage Service
// 只有这个文件直接访问 localStorage；其他代码只调用这里的方法。
// ================================================================

const STORAGE_KEYS = Object.freeze({
    WORKS: "kris-photography-works",
    GALLERY: "kris-photography-gallery"
});

const storageService = Object.freeze({
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Unable to save local content for "${key}".`, error);
            return false;
        }
    },

    loadData(key) {
        let storedValue;

        try {
            storedValue = localStorage.getItem(key);
        } catch (error) {
            console.error(`Unable to read local content for "${key}".`, error);
            return null;
        }

        if (storedValue === null) return null;

        try {
            return JSON.parse(storedValue);
        } catch (error) {
            console.error(`Unable to parse local content for "${key}".`, error);
            return null;
        }
    }
});
