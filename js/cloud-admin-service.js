// Cloud Admin uses the same UI fields but only the Supabase repository writes rows.
const cloudAdminService = Object.freeze({
    getWorks: () => supabaseRepository.getCollections(),
    getGalleryItems: () => supabaseRepository.getPhotos(),
    async getWorkById(id) {
        return (await this.getWorks()).find((work) => work.id === id) || null;
    },
    async getGalleryItemById(id) {
        return (await this.getGalleryItems()).find((photo) => photo.id === id) || null;
    },
    photoRowExists: (id) => supabaseRepository.photoRowExists(id),
    createWork(values) {
        return supabaseRepository.createCollection({ ...values, id: createContentId("work") });
    },
    updateWork(id, values) {
        return supabaseRepository.updateCollection(id, values);
    },
    deleteWork: (id) => supabaseRepository.deleteCollection(id),
    createGalleryItem(values) {
        return supabaseRepository.createPhoto({ ...values, id: values.id || createContentId("photo") });
    },
    updateGalleryItem(id, values) {
        return supabaseRepository.updatePhoto(id, values);
    },
    deleteGalleryItem: (id) => supabaseRepository.deletePhoto(id)
});
