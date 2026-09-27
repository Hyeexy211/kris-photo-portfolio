// ================================================================
// Browser-local and authenticated cloud Admin share the same forms.
// Form handlers use the selected content adapter; they do not access storage directly.
// ================================================================

const adminStatus = document.querySelector("#admin-status");
const workForm = document.querySelector("#work-form");
const galleryForm = document.querySelector("#gallery-form");
const workList = document.querySelector("#work-list");
const galleryList = document.querySelector("#gallery-list");
const workCount = document.querySelector("#work-count");
const galleryCount = document.querySelector("#gallery-count");
const cancelWorkEdit = document.querySelector("#cancel-work-edit");
const cancelGalleryEdit = document.querySelector("#cancel-gallery-edit");
const resetContentButton = document.querySelector("#reset-content");
const cloudMode = new URLSearchParams(window.location.search).get("mode") !== "local";
const openedAsFile = window.location.protocol === "file:";
const adminStore = cloudMode ? cloudAdminService : contentService;
const authSection = document.querySelector("#admin-auth");
const authHeading = document.querySelector("#admin-auth-title");
const loginForm = document.querySelector("#admin-login-form");
const signOutButton = document.querySelector("#admin-sign-out");
const resetSection = document.querySelector("#admin-reset");
const imageControls = {
    work: {
        form: workForm,
        field: document.querySelector("#work-upload-field"),
        file: document.querySelector("#work-upload-file"),
        fileName: document.querySelector("#work-file-name"),
        clear: document.querySelector("#clear-work-image"),
        preview: document.querySelector("#work-image-preview"),
        previewImage: document.querySelector("#work-preview-image"),
        previewCaption: document.querySelector("#work-preview-caption"),
        progress: document.querySelector("#work-upload-progress"),
        message: document.querySelector("#work-upload-message"),
        count: document.querySelector("#work-upload-count"),
        imageField: "cover"
    },
    gallery: {
        form: galleryForm,
        field: document.querySelector("#gallery-upload-field"),
        file: document.querySelector("#gallery-upload-file"),
        fileName: document.querySelector("#gallery-file-name"),
        clear: document.querySelector("#clear-gallery-image"),
        preview: document.querySelector("#gallery-image-preview"),
        previewImage: document.querySelector("#gallery-preview-image"),
        previewCaption: document.querySelector("#gallery-preview-caption"),
        progress: document.querySelector("#gallery-upload-progress"),
        message: document.querySelector("#gallery-upload-message"),
        count: document.querySelector("#gallery-upload-count"),
        imageField: "src"
    }
};
const adminI18n = window.siteI18n;
const adminT = (key, values) => adminI18n.t(key, values);
let cloudAccessGeneration = 0;
let workSaving = false;
let gallerySaving = false;
let adminAccessAllowed = false;
let currentWorks = null;
let currentGalleryItems = null;
let currentCategories = null;
let currentStatus = null;
const currentUploadProgress = { work: null, gallery: null };
const previewObjectUrls = { work: null, gallery: null };
const membershipCollection = document.querySelector("#membership-collection");
const membershipSearch = document.querySelector("#membership-search");
const membershipList = document.querySelector("#membership-list");
const membershipSummary = document.querySelector("#membership-summary");
const membershipAdd = document.querySelector("#membership-add");
const membershipRemove = document.querySelector("#membership-remove");
const membershipSaveOrder = document.querySelector("#membership-save-order");
const membershipCategory = document.querySelector("#membership-category");
const membershipSetCategory = document.querySelector("#membership-set-category");
const membershipDelete = document.querySelector("#membership-delete");
const batchResults = document.querySelector("#batch-results");
const batchRetryUpdates = document.querySelector("#batch-retry-updates");
const categoryCreateForm = document.querySelector("#category-create-form");
const categoryRenameForm = document.querySelector("#category-rename-form");
const categoryMergeForm = document.querySelector("#category-merge-form");
const categoryDeleteTarget = document.querySelector("#category-delete-target");
const categoryDelete = document.querySelector("#category-delete");
const batchPhotoFiles = document.querySelector("#batch-photo-files");
const batchUploadList = document.querySelector("#batch-upload-list");
const batchUploadAll = document.querySelector("#batch-upload-all");
const batchRetryFailed = document.querySelector("#batch-retry-failed");
const batchClearDone = document.querySelector("#batch-clear-done");
const batchUploadSummary = document.querySelector("#batch-upload-summary");
const exifReviewSection = document.querySelector("#exif-review");
const exifReviewStatus = document.querySelector("#exif-review-status");
const exifReviewFields = document.querySelector("#exif-review-fields");
const exifFieldNames = ["date", "captureTime", "camera", "lens", "focalLength", "aperture", "shutterSpeed", "iso"];
const exifFieldLabels = { date: "shootingDate", captureTime: "captureTime" };
let selectedMembershipIds = new Set();
let membershipOrderDraft = null;
let bulkSaving = false;
let exifSelectionGeneration = 0;
let exifReviewPromise = Promise.resolve();
let exifReviewData = null;
let exifCandidates = {};
let exifDecisions = {};
let photoQueue = [];
let selectedQueueId = null;
let queueSaving = false;
let lastBatchRetry = null;
const unresolvedUploadStatus = { work: null, gallery: null };

function renderAdminStatus() {
    if (!currentStatus) return;
    adminStatus.textContent = currentStatus.parts.map(({ key, values, text }) => (
        key ? adminT(key, values) : text
    )).join(" ");
    adminStatus.classList.toggle("is-error", currentStatus.isError);
}

function showAdminStatusParts(parts, isError = false) {
    currentStatus = { parts, isError };
    renderAdminStatus();
}

function showAdminStatus(key, isError = false, values = {}) {
    showAdminStatusParts([{ key, values }], isError);
}

function localizedError(key) {
    const error = new Error(key);
    error.translationKey = key;
    return error;
}

function errorParts(error, includePrefix = true) {
    return error.translationKey
        ? [{ key: error.translationKey, values: error.translationValues || {} }]
        : includePrefix
            ? [{ key: "admin.error.external", values: { message: error.message || String(error) } }]
            : [{ text: error.message || String(error) }];
}

function showAdminError(error) {
    showAdminStatusParts(errorParts(error), true);
}

function uploadNeedsReview() {
    return currentStatus?.parts.some(({ key }) => [
        "admin.queue.needsReview", "admin.upload.cleanupFailed",
        "admin.upload.rowCheckFailedFilesKept"
    ].includes(key));
}

function cloudWriteFailureIsDefinitive(error) {
    return /duplicate key|violates (?:foreign key|not-null|check|unique)|row-level security|permission denied|invalid input syntax|multiple \(or no\) rows returned/i
        .test(error.message || "");
}

function renderUploadProgress(kind) {
    const progress = currentUploadProgress[kind];
    if (!progress) return;
    imageControls[kind].message.textContent = adminT(progress.key, progress.values);
}

function getFormValues(form, numberFields) {
    const values = Object.fromEntries(new FormData(form).entries());
    const id = values.id;

    delete values.id;

    numberFields.forEach((fieldName) => {
        values[fieldName] = values[fieldName] === "" ? "" : Number(values[fieldName]);
    });

    return { id, values };
}

function fillForm(form, item) {
    [...form.elements].forEach((field) => {
        if (!field.name) return;
        const value = item[field.name];
        field.value = Array.isArray(value) ? value.join(", ") : value ?? "";
    });
}

function resetWorkForm() {
    workForm.reset();
    workForm.elements.id.value = "";
    document.querySelector("#work-form-title").textContent = adminT("admin.works.createTitle");
    cancelWorkEdit.hidden = true;
    resetImageControl("work");
}

function resetGalleryForm() {
    selectedQueueId = null;
    galleryForm.reset();
    galleryForm.elements.id.value = "";
    document.querySelector("#gallery-form-title").textContent = adminT("admin.gallery.createTitle");
    cancelGalleryEdit.hidden = true;
    clearExifReview();
    resetImageControl("gallery");
}

function syncImageFields(kind) {
    const { form, field, file, clear } = imageControls[kind];
    field.hidden = kind === "work" ? !cloudMode
        : cloudMode && !form.elements.id.value && !selectedQueueId;
    form.querySelectorAll(".admin-manual-image-field").forEach((label) => {
        label.hidden = cloudMode;
    });
    const requiredFields = kind === "work" ? ["cover"] : ["src", "fullSrc"];
    requiredFields.forEach((fieldName) => {
        form.elements[fieldName].required = !cloudMode;
    });
    file.disabled = (kind === "work" && !cloudMode) || (kind === "work"
        ? workSaving : gallerySaving || queueSaving || Boolean(selectedQueueId));
    clear.disabled = file.disabled;
}

function renderImagePreview(kind) {
    const control = imageControls[kind];
    const queuedPhoto = kind === "gallery"
        ? photoQueue.find((item) => item.id === selectedQueueId) : null;
    const selectedFile = queuedPhoto?.file || control.file.files[0];
    if (previewObjectUrls[kind]) URL.revokeObjectURL(previewObjectUrls[kind]);
    previewObjectUrls[kind] = null;
    control.clear.hidden = !selectedFile || Boolean(queuedPhoto);
    control.fileName.textContent = selectedFile?.name || "";

    if (selectedFile) {
        try {
            validateCloudImageFile(selectedFile);
        } catch (error) {
            if (queuedPhoto) {
                queuedPhoto.status = "failed";
                queuedPhoto.error = error.translationKey
                    ? adminT(error.translationKey, error.translationValues || {}) : error.message;
                control.preview.hidden = true;
                showAdminError(error);
                renderPhotoQueue();
                return;
            }
            control.file.value = "";
            showAdminError(error);
            renderImagePreview(kind);
            return;
        }
        previewObjectUrls[kind] = URL.createObjectURL(selectedFile);
        control.previewImage.src = previewObjectUrls[kind];
        control.previewCaption.textContent = adminT("admin.upload.selectedPreview");
        control.preview.hidden = false;
        return;
    }

    const currentUrl = control.form.elements.id.value
        ? control.form.elements[control.imageField].value : "";
    if (currentUrl) {
        control.previewImage.src = currentUrl;
        control.previewCaption.textContent = adminT("admin.upload.currentPreview");
        control.preview.hidden = false;
    } else {
        control.previewImage.removeAttribute("src");
        control.preview.hidden = true;
    }
}

function resetImageControl(kind) {
    const control = imageControls[kind];
    control.file.value = "";
    control.progress.hidden = true;
    currentUploadProgress[kind] = null;
    renderImagePreview(kind);
    syncImageFields(kind);
}

function showUploadProgress(kind, key, completed, values = {}) {
    const control = imageControls[kind];
    control.progress.hidden = false;
    currentUploadProgress[kind] = { key, values };
    renderUploadProgress(kind);
    control.count.value = completed;
}

function readPhotoFormValues() {
    const { values } = getFormValues(galleryForm, ["order", "collectionOrder", "width", "height"]);
    values.title = values.title.trim();
    values.category = values.category.trim();
    values.collectionId = values.collectionId || null;
    values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!values.collectionId) values.collectionOrder = null;
    return values;
}

function saveQueueDraftFromForm() {
    if (!selectedQueueId) return;
    const item = photoQueue.find((photo) => photo.id === selectedQueueId);
    if (!item || item.status === "success") return;
    item.values = readPhotoFormValues();
    renderPhotoQueue();
}

function queueItemStatus(item) {
    const key = `admin.queue.${item.status}`;
    const values = item.status === "uploading" ? { count: item.progress } : {};
    return `${adminT(key, values)}${item.error ? ` · ${item.error}` : ""}`;
}

function renderPhotoQueue() {
    const fragment = document.createDocumentFragment();
    photoQueue.forEach((item) => {
        const row = document.createElement("article");
        const image = document.createElement("img");
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        const meta = document.createElement("span");
        const actions = document.createElement("div");
        const edit = document.createElement("button");
        row.className = "admin-photo-row admin-queue-row";
        if (item.id === selectedQueueId) row.classList.add("is-selected");
        image.src = item.previewUrl;
        image.alt = "";
        copy.className = "admin-photo-copy";
        title.textContent = item.values.title || adminT("admin.queue.untitledDraft");
        meta.textContent = `${item.file.name} · ${collectionName(item.values.collectionId)} · ${queueItemStatus(item)}`;
        copy.append(title, meta);
        actions.className = "admin-item-actions";
        edit.className = "admin-button";
        edit.type = "button";
        edit.dataset.queueAction = "edit";
        edit.dataset.id = item.id;
        edit.textContent = adminT("admin.queue.editDetails");
        edit.disabled = queueSaving || item.status === "success" || item.status === "needsReview";
        actions.appendChild(edit);
        if (item.status !== "success" && item.status !== "needsReview") {
            const remove = document.createElement("button");
            remove.className = "admin-button";
            remove.type = "button";
            remove.dataset.queueAction = "remove";
            remove.dataset.id = item.id;
            remove.textContent = adminT("admin.queue.removeDraft");
            remove.disabled = queueSaving;
            actions.appendChild(remove);
        }
        row.append(image, copy, actions);
        fragment.appendChild(row);
    });
    batchUploadList.replaceChildren(photoQueue.length
        ? fragment : createEmptyMessage("admin.queue.empty"));
    const success = photoQueue.filter((item) => item.status === "success").length;
    const failed = photoQueue.filter((item) => item.status === "failed").length;
    const review = photoQueue.filter((item) => item.status === "needsReview").length;
    batchUploadSummary.textContent = adminT("admin.queue.summary", {
        total: photoQueue.length, success, failed, review
    });
    batchUploadAll.disabled = queueSaving || !photoQueue.some((item) =>
        item.status === "draft" || item.status === "failed");
    batchRetryFailed.disabled = queueSaving || failed === 0;
    batchClearDone.disabled = queueSaving || success === 0;
    batchPhotoFiles.disabled = queueSaving || !membershipCollection.value;
}

function selectQueuePhoto(id) {
    if (queueSaving) return;
    saveQueueDraftFromForm();
    const item = photoQueue.find((photo) => photo.id === id);
    if (!item || item.status === "success" || item.status === "needsReview") return;
    resetGalleryForm();
    selectedQueueId = id;
    fillForm(galleryForm, item.values);
    imageControls.gallery.file.value = "";
    renderImagePreview("gallery");
    readSelectedPhotoExif(item.file);
    syncImageFields("gallery");
    renderPhotoQueue();
    document.querySelector("#gallery-form-title").textContent = adminT("admin.queue.detailsTitle");
    galleryForm.scrollIntoView({ behavior: "smooth", block: "start" });
    galleryForm.elements.title.focus({ preventScroll: true });
}

function forgetQueueItem(item) {
    URL.revokeObjectURL(item.previewUrl);
    photoQueue = photoQueue.filter((photo) => photo.id !== item.id);
    if (selectedQueueId === item.id) resetGalleryForm();
    renderPhotoQueue();
}

function validateQueueDetails(item) {
    if (!item.values.title?.trim()) throw localizedError("admin.queue.titleRequired");
    if (!currentCategories?.some((category) => category.id === item.values.category)) {
        throw localizedError("admin.queue.categoryRequired");
    }
    if (!currentWorks?.some((work) => work.id === item.values.collectionId)) {
        throw localizedError("admin.queue.collectionRequired");
    }
    validateCloudImageFile(item.file);
}

async function uploadQueueItems(items) {
    if (!cloudMode || queueSaving || !adminAccessAllowed) return;
    saveQueueDraftFromForm();
    const disabledControls = [...galleryForm.elements].map((field) => [field, field.disabled]);
    queueSaving = true;
    const accessGeneration = cloudAccessGeneration;
    disabledControls.forEach(([field]) => { field.disabled = true; });
    membershipCollection.disabled = true;
    renderPhotoQueue();
    signOutButton.disabled = true;
    try {
        for (const item of items) {
            if (accessGeneration !== cloudAccessGeneration) break;
            try {
                // A fixed ID lets a retry recognize an insert that succeeded despite a lost response.
                if (await cloudAdminService.photoRowExists(item.id)) {
                    item.status = "success";
                    item.error = "";
                    renderPhotoQueue();
                    continue;
                }
                validateQueueDetails(item);
                item.status = "preparing";
                item.progress = 0;
                item.error = "";
                renderPhotoQueue();
                const saved = await saveImageRecord("gallery", "", { ...item.values }, item.file, {
                    recordId: item.id,
                    skipExifWait: true,
                    onProgress(status, completed) {
                        item.status = status;
                        item.progress = completed;
                        renderPhotoQueue();
                    }
                });
                if (!saved) {
                    if (uploadNeedsReview()) {
                        item.status = "needsReview";
                        item.error = adminStatus.textContent;
                        renderPhotoQueue();
                        continue;
                    }
                    let rowExists;
                    try {
                        rowExists = await cloudAdminService.photoRowExists(item.id);
                    } catch {
                        item.status = "needsReview";
                        item.error = adminStatus.textContent;
                        renderPhotoQueue();
                        continue;
                    }
                    if (!rowExists) {
                        throw new Error(adminStatus.textContent || adminT("admin.gallery.saveFailed"));
                    }
                }
                item.status = "success";
                item.error = "";
                if (selectedQueueId === item.id) resetGalleryForm();
            } catch (error) {
                item.status = "failed";
                item.error = error.translationKey
                    ? adminT(error.translationKey, error.translationValues || {})
                    : error.message || String(error);
            }
            renderPhotoQueue();
        }
        await renderGalleryAdmin();
        showAdminStatus("admin.queue.finished", false, {
            success: photoQueue.filter((item) => item.status === "success").length,
            failed: photoQueue.filter((item) => item.status === "failed").length,
            review: photoQueue.filter((item) => item.status === "needsReview").length
        });
    } catch (error) {
        showAdminError(error);
    } finally {
        queueSaving = false;
        disabledControls.forEach(([field, wasDisabled]) => { field.disabled = wasDisabled; });
        membershipCollection.disabled = !(currentWorks || []).length || bulkSaving;
        signOutButton.disabled = workSaving || gallerySaving || bulkSaving;
        renderPhotoQueue();
        syncImageFields("gallery");
    }
}

function createAdminItem(item, metaText, itemTypeKey) {
    const row = document.createElement("article");
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const displayTitle = adminI18n.content(item, "title") || adminT("admin.untitled");

    row.className = "admin-item";
    title.textContent = displayTitle;
    meta.textContent = metaText;
    actions.className = "admin-item-actions";

    editButton.className = "admin-button";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = item.id;
    editButton.textContent = adminT("admin.actions.edit");

    deleteButton.className = "admin-button admin-button-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = adminT("admin.actions.delete");
    deleteButton.setAttribute("aria-label", adminT("admin.actions.deleteAria", {
        type: adminT(itemTypeKey),
        title: displayTitle
    }));

    copy.append(title, meta);
    actions.append(editButton, deleteButton);
    row.append(copy, actions);

    return row;
}

function createEmptyMessage(key) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "admin-list-empty";
    emptyMessage.textContent = adminT(key);
    return emptyMessage;
}

function renderWorksList(works) {
    const fragment = document.createDocumentFragment();

    works.forEach((work) => {
        fragment.appendChild(
            createAdminItem(work, adminT("admin.works.meta", {
                id: work.id,
                slug: work.slug || adminT("admin.none"),
                order: work.order ?? adminT("admin.none")
            }), "admin.works.itemType")
        );
    });

    workList.replaceChildren(works.length > 0 ? fragment : createEmptyMessage("admin.works.empty"));
    workCount.textContent = String(works.length);
}

async function renderWorksAdmin() {
    currentWorks = await adminStore.getWorks();
    renderWorksList(currentWorks);
}

function renderGalleryList(galleryItems) {
    const fragment = document.createDocumentFragment();

    galleryItems.forEach((item) => {
        fragment.appendChild(
            createAdminItem(
                item,
                adminT("admin.gallery.meta", {
                    id: item.id,
                    category: categoryName(item.category) || adminT("admin.none"),
                    collection: item.collectionId || adminT("admin.none")
                }),
                "admin.gallery.itemType"
            )
        );
    });

    galleryList.replaceChildren(
        galleryItems.length > 0 ? fragment : createEmptyMessage("admin.gallery.empty")
    );
    galleryCount.textContent = String(galleryItems.length);
}

async function renderGalleryAdmin() {
    currentGalleryItems = await adminStore.getGalleryItems();
    renderGalleryList(currentGalleryItems);
    renderAdminBatchControls();
}

async function renderAdmin() {
    await renderCategoriesAdmin();
    await Promise.all([renderWorksAdmin(), renderGalleryAdmin()]);
    renderAdminBatchControls();
    renderPhotoQueue();
}

async function renderCategoriesAdmin() {
    currentCategories = await adminStore.getCategories();
    renderCategoryOptions();
}

function categoryName(id) {
    return currentCategories?.find((item) => item.id === id)?.name
        || adminI18n.category(id) || id || "";
}

function collectionName(id) {
    const collection = currentWorks?.find((work) => work.id === id);
    return collection ? adminI18n.content(collection, "title") || collection.title || id : id;
}

function orderedCollectionPhotos(collectionId) {
    return (currentGalleryItems || []).filter((photo) => photo.collectionId === collectionId)
        .sort((a, b) => {
            const orderA = Number.isFinite(a.collectionOrder) ? a.collectionOrder
                : Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = Number.isFinite(b.collectionOrder) ? b.collectionOrder
                : Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
}

function renderCollectionOptions() {
    const previousId = membershipCollection.value;
    const fragment = document.createDocumentFragment();
    (currentWorks || []).forEach((work) => {
        const option = document.createElement("option");
        option.value = work.id;
        option.textContent = adminI18n.content(work, "title") || work.title || work.id;
        fragment.appendChild(option);
    });
    membershipCollection.replaceChildren(fragment);
    if ((currentWorks || []).some((work) => work.id === previousId)) {
        membershipCollection.value = previousId;
    } else {
        selectedMembershipIds.clear();
        membershipOrderDraft = null;
    }
    membershipCollection.disabled = !currentWorks?.length || bulkSaving;
    const photoCollection = galleryForm.elements.collectionId;
    const previousPhotoCollection = photoCollection.value;
    const photoOptions = document.createDocumentFragment();
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = adminT("admin.membership.unassigned");
    photoOptions.appendChild(emptyOption);
    (currentWorks || []).forEach((work) => {
        const option = document.createElement("option");
        option.value = work.id;
        option.textContent = adminI18n.content(work, "title") || work.title || work.id;
        photoOptions.appendChild(option);
    });
    photoCollection.replaceChildren(photoOptions);
    if ((currentWorks || []).some((work) => work.id === previousPhotoCollection)) {
        photoCollection.value = previousPhotoCollection;
    } else if (!galleryForm.elements.id.value) {
        photoCollection.value = membershipCollection.value;
    }
}

function renderCategoryOptions() {
    const categories = currentCategories || [];
    const selects = [workForm.elements.category, galleryForm.elements.category,
        membershipCategory, categoryRenameForm.elements.source,
        categoryMergeForm.elements.source, categoryMergeForm.elements.target,
        categoryDeleteTarget];
    const used = new Set([...(currentWorks || []), ...(currentGalleryItems || [])]
        .map((item) => item.category).filter(Boolean));
    selects.forEach((select) => {
        const previous = select.value;
        const options = document.createDocumentFragment();
        if ([workForm.elements.category, galleryForm.elements.category, membershipCategory]
            .includes(select)) {
            const emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = adminT("admin.categories.choose");
            options.appendChild(emptyOption);
        }
        categories.filter((category) => select !== categoryDeleteTarget || !used.has(category.id))
            .forEach((category) => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                options.appendChild(option);
            });
        select.replaceChildren(options);
        if (categories.some((item) => item.id === previous)) select.value = previous;
    });
    const hasCategories = categories.length > 0;
    categoryRenameForm.elements.source.disabled = !hasCategories || bulkSaving;
    categoryMergeForm.elements.source.disabled = categories.length < 2 || bulkSaving;
    categoryMergeForm.elements.target.disabled = categories.length < 2 || bulkSaving;
    categoryDelete.disabled = !categoryDeleteTarget.options.length || bulkSaving;
    categoryDeleteTarget.disabled = categoryDelete.disabled;
    membershipCategory.disabled = !hasCategories || bulkSaving;
    membershipSetCategory.disabled = !hasCategories || bulkSaving
        || selectedMembershipIds.size === 0;
}

function renderMembershipList() {
    const collectionId = membershipCollection.value;
    if (!collectionId) {
        membershipList.replaceChildren(createEmptyMessage("admin.membership.noCollections"));
        membershipSummary.textContent = "";
        membershipAdd.disabled = true;
        membershipRemove.disabled = true;
        membershipSaveOrder.disabled = true;
        return;
    }

    const members = orderedCollectionPhotos(collectionId);
    const memberIds = members.map((photo) => photo.id);
    if (!membershipOrderDraft || membershipOrderDraft.length !== memberIds.length
        || membershipOrderDraft.some((id) => !memberIds.includes(id))) {
        membershipOrderDraft = memberIds;
    }
    const photoById = new Map((currentGalleryItems || []).map((photo) => [photo.id, photo]));
    const orderedMembers = membershipOrderDraft.map((id) => photoById.get(id)).filter(Boolean);
    const otherPhotos = (currentGalleryItems || []).filter((photo) => photo.collectionId !== collectionId);
    const search = membershipSearch.value.trim().toLocaleLowerCase();
    const visible = [...orderedMembers, ...otherPhotos].filter((photo) => {
        const title = adminI18n.content(photo, "title") || photo.title || "";
        const category = categoryName(photo.category);
        return !search || `${title} ${category} ${photo.category || ""}`
            .toLocaleLowerCase().includes(search);
    });
    const fragment = document.createDocumentFragment();

    visible.forEach((photo) => {
        const row = document.createElement("article");
        const picker = document.createElement("label");
        const checkbox = document.createElement("input");
        const image = document.createElement("img");
        const imageFallback = document.createElement("span");
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        const meta = document.createElement("span");
        const order = document.createElement("span");
        const displayTitle = adminI18n.content(photo, "title") || photo.title || adminT("admin.untitled");
        row.className = "admin-photo-row";
        picker.className = "admin-photo-picker";
        checkbox.type = "checkbox";
        checkbox.value = photo.id;
        checkbox.checked = selectedMembershipIds.has(photo.id);
        checkbox.disabled = bulkSaving;
        checkbox.setAttribute("aria-label", adminT("admin.membership.select", { title: displayTitle }));
        imageFallback.className = "admin-photo-fallback";
        imageFallback.textContent = adminT("admin.membership.imageMissing");
        imageFallback.hidden = Boolean(photo.src);
        image.alt = photo.alt || displayTitle;
        image.loading = "lazy";
        image.hidden = !photo.src;
        if (photo.src) {
            image.src = photo.src;
            if (photo.srcset) image.srcset = photo.srcset;
            image.sizes = "96px";
            image.addEventListener("error", () => {
                image.hidden = true;
                imageFallback.hidden = false;
            });
        }
        copy.className = "admin-photo-copy";
        title.textContent = displayTitle;
        const belonging = photo.collectionId === collectionId
            ? adminT("admin.membership.current")
            : photo.collectionId
                ? adminT("admin.membership.other", { title: collectionName(photo.collectionId) })
                : adminT("admin.membership.unassigned");
        meta.textContent = `${categoryName(photo.category) || adminT("admin.none")} · ${belonging}`;
        copy.append(title, meta);
        picker.append(checkbox, image, imageFallback, copy);
        row.appendChild(picker);
        if (photo.collectionId === collectionId) {
            order.className = "admin-photo-order";
            const index = membershipOrderDraft.indexOf(photo.id);
            const position = document.createElement("span");
            position.textContent = String(index + 1);
            order.appendChild(position);
            for (const [action, key, disabled] of [
                ["up", "up", index === 0],
                ["down", "down", index === membershipOrderDraft.length - 1]
            ]) {
                const button = document.createElement("button");
                button.className = "admin-button admin-order-button";
                button.type = "button";
                button.dataset.order = action;
                button.dataset.id = photo.id;
                button.textContent = action === "up" ? "↑" : "↓";
                button.setAttribute("aria-label", adminT(`admin.membership.${key}`, { title: displayTitle }));
                button.disabled = disabled || bulkSaving;
                order.appendChild(button);
            }
            row.appendChild(order);
        }
        fragment.appendChild(row);
    });

    membershipList.replaceChildren(visible.length ? fragment : createEmptyMessage("admin.membership.noPhotos"));
    membershipSummary.textContent = adminT("admin.membership.summary", {
        total: currentGalleryItems?.length || 0,
        members: members.length,
        selected: selectedMembershipIds.size
    });
    membershipAdd.disabled = bulkSaving;
    membershipRemove.disabled = bulkSaving;
    membershipSaveOrder.disabled = bulkSaving || members.length < 2;
    membershipSearch.disabled = bulkSaving;
    categoryRenameForm.elements.target.disabled = bulkSaving;
    membershipDelete.disabled = bulkSaving || selectedMembershipIds.size === 0;
    membershipSetCategory.disabled = bulkSaving || selectedMembershipIds.size === 0
        || !(currentCategories || []).length;
}

function renderAdminBatchControls() {
    const knownIds = new Set((currentGalleryItems || []).map((photo) => photo.id));
    selectedMembershipIds = new Set([...selectedMembershipIds].filter((id) => knownIds.has(id)));
    renderCollectionOptions();
    renderCategoryOptions();
    renderMembershipList();
}

function setBulkSaving(saving) {
    bulkSaving = saving;
    renderAdminBatchControls();
    batchRetryUpdates.disabled = saving;
    if (cloudMode) signOutButton.disabled = saving || workSaving || gallerySaving || queueSaving;
}

function appendBatchResult(photo, key, values = {}) {
    const row = document.createElement("p");
    row.textContent = `${photo.title || photo.id}: ${adminT(key, values)}`;
    batchResults.appendChild(row);
    return row;
}

async function savePhotoBatch(photos, changePhoto, successKey, successValues = {},
    partialKey = "admin.membership.partial") {
    setBulkSaving(true);
    batchResults.replaceChildren();
    let savedCount = 0;
    const failed = [];
    for (const [index, photo] of photos.entries()) {
        const resultRow = appendBatchResult(photo, "admin.membership.savingOne", {
            current: index + 1, total: photos.length
        });
        try {
            const latest = await adminStore.getGalleryItemById(photo.id);
            if (!latest) throw new Error(`Photo ${photo.id} no longer exists.`);
            const changes = changePhoto(latest, savedCount);
            if (!changes) {
                resultRow.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.skippedOne")}`;
                continue;
            }
            const saved = await adminStore.updateGalleryItem(latest.id, changes);
            if (!saved) throw localizedError("admin.gallery.saveFailed");
            savedCount++;
            resultRow.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.savedOne")}`;
        } catch (error) {
            failed.push({ photo, error });
            resultRow.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.failedOne", {
                message: error.translationKey ? adminT(error.translationKey) : error.message || String(error)
            })}`;
        }
    }

    selectedMembershipIds = new Set(failed.map(({ photo }) => photo.id));
    membershipOrderDraft = null;
    lastBatchRetry = failed.length ? () => savePhotoBatch(failed.map(({ photo }) => photo),
        changePhoto, successKey, successValues, partialKey) : null;
    batchRetryUpdates.hidden = !lastBatchRetry;
    try {
        await renderGalleryAdmin();
        if (failed.length) {
            showAdminStatus(partialKey, true, {
                count: savedCount,
                message: `${failed.length} ${adminT("admin.membership.failedCount")}`
            });
        } else {
            showAdminStatus(successKey, false, { count: savedCount, ...successValues });
        }
    } catch (reloadError) {
        showAdminStatus("admin.membership.reloadFailed", true, {
            message: reloadError.message || String(reloadError)
        });
    } finally {
        setBulkSaving(false);
    }
    return { savedCount, failed };
}

function clearExifReview() {
    exifSelectionGeneration++;
    exifReviewData = null;
    exifCandidates = {};
    exifDecisions = {};
    exifReviewPromise = Promise.resolve();
    exifReviewFields.replaceChildren();
    exifReviewStatus.textContent = "";
    exifReviewSection.hidden = true;
}

function renderExifReview() {
    if (!exifReviewData) return;
    exifReviewSection.hidden = false;
    const statusKey = {
        ok: "ok", "no-exif": "noExif", "invalid-exif": "invalidExif", unsupported: "unsupported"
    }[exifReviewData.status] || "invalidExif";
    exifReviewStatus.textContent = adminT(`admin.exif.${statusKey}`)
        + (exifReviewData.hasGps ? ` ${adminT("admin.exif.gps")}` : "");
    const fragment = document.createDocumentFragment();
    exifFieldNames.forEach((fieldName) => {
        const row = document.createElement("div");
        const label = document.createElement("label");
        const input = document.createElement("input");
        const actions = document.createElement("span");
        const decision = document.createElement("span");
        row.className = "admin-exif-row";
        label.htmlFor = `exif-candidate-${fieldName}`;
        label.textContent = adminT(`admin.fields.${exifFieldLabels[fieldName] || fieldName}`);
        input.id = `exif-candidate-${fieldName}`;
        input.type = fieldName === "date" ? "date" : fieldName === "captureTime" ? "time" : "text";
        if (fieldName === "captureTime") input.step = "1";
        input.dataset.exifField = fieldName;
        input.value = exifCandidates[fieldName] || "";
        input.placeholder = adminT("admin.exif.missing");
        actions.className = "admin-exif-actions";
        for (const [action, labelKey] of [["accept", "accept"], ["reject", "reject"], ["clear", "clear"]]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "admin-button";
            button.dataset.exifAction = action;
            button.dataset.exifField = fieldName;
            button.textContent = adminT(`admin.exif.${labelKey}`);
            actions.appendChild(button);
        }
        decision.className = "admin-exif-decision";
        decision.dataset.exifDecision = fieldName;
        decision.textContent = adminT(`admin.exif.${exifDecisions[fieldName]
            || (exifCandidates[fieldName] ? "pending" : "missing")}`);
        row.append(label, input, actions, decision);
        fragment.appendChild(row);
    });
    exifReviewFields.replaceChildren(fragment);
}

function readSelectedPhotoExif(file) {
    clearExifReview();
    if (!file) return;
    const generation = exifSelectionGeneration;
    exifReviewSection.hidden = false;
    exifReviewStatus.textContent = adminT("admin.exif.reading");
    exifReviewPromise = Promise.resolve().then(() => window.reviewJpegExif(file))
        .then((review) => {
            if (generation !== exifSelectionGeneration) return;
            exifReviewData = review;
            exifCandidates = Object.fromEntries(exifFieldNames.map((name) => [name, review[name] || ""]));
            exifDecisions = {};
            renderExifReview();
        })
        .catch(() => {
            if (generation !== exifSelectionGeneration) return;
            exifReviewData = { status: "invalid-exif", hasGps: false };
            exifCandidates = {};
            exifDecisions = {};
            renderExifReview();
        });
}

async function saveImageRecord(kind, id, values, selectedFile, options = {}) {
    const isWork = kind === "work";
    const recordId = id || options.recordId || createContentId(isWork ? "work" : "photo");
    const attemptedPaths = [];
    const uploadedPaths = [];
    const accessGeneration = cloudAccessGeneration;
    let databaseWriteAttempted = false;
    let uploadedUrl = "";

    try {
        if (cloudMode && !id && !selectedFile) {
            throw localizedError("admin.upload.imageRequired");
        }
        if (selectedFile) {
            if (!isWork && !options.skipExifWait) await exifReviewPromise;
            showUploadProgress(kind, "admin.upload.preparing", 0);
            options.onProgress?.("preparing", 0);
            const exports = await prepareCloudWebExports(selectedFile);
            const images = await uploadCloudWebExports(
                isWork ? "collections" : "photos", recordId, exports, (path) => {
                    uploadedPaths.push(path);
                    showUploadProgress(kind, "admin.upload.filesUploaded", uploadedPaths.length, {
                        count: uploadedPaths.length
                    });
                    options.onProgress?.("uploading", uploadedPaths.length);
                }, (path) => attemptedPaths.push(path)
            );
            if (accessGeneration !== cloudAccessGeneration) {
                throw localizedError("admin.upload.sessionChanged");
            }
            uploadedUrl = images.src;
            Object.assign(values, isWork ? {
                cover: images.src,
                coverSrcset: images.srcset,
                coverWidth: images.width,
                coverHeight: images.height
            } : {
                src: images.src,
                fullSrc: images.fullSrc,
                srcset: images.srcset,
                width: images.width,
                height: images.height
            });
            showUploadProgress(kind, "admin.upload.savingRecord", 3);
            options.onProgress?.("saving", 3);
        }

        if (!id && cloudMode) values.id = recordId;
        databaseWriteAttempted = true;
        let saved;
        if (isWork) {
            saved = id ? await adminStore.updateWork(id, values) : await adminStore.createWork(values);
        } else {
            saved = id ? await adminStore.updateGalleryItem(id, values)
                : await adminStore.createGalleryItem(values);
        }
        if (!saved) throw localizedError(isWork ? "admin.works.saveFailed" : "admin.gallery.saveFailed");
        return saved;
    } catch (error) {
        const messages = errorParts(error);
        let needsReview = Boolean(error.uploadOutcomeUnknown);
        if (attemptedPaths.length > 0) {
            let cleanupIsSafe = true;
            if (databaseWriteAttempted && uploadedUrl) {
                try {
                    if (await cloudAdminService.imageRowUsesUrl(
                        isWork ? "collections" : "photos", recordId, uploadedUrl
                    )) {
                        // The database committed even though its reply was lost.
                        return { ...values, id: recordId };
                    }
                } catch {
                    cleanupIsSafe = false;
                    needsReview = true;
                    messages.push({ key: "admin.upload.rowCheckFailedFilesKept" });
                }
                if (!cloudWriteFailureIsDefinitive(error)) {
                    // A network/server failure can leave a write in flight after
                    // the first row check. Keep its files until manually checked.
                    cleanupIsSafe = false;
                    needsReview = true;
                }
            }
            if (cleanupIsSafe) {
                try {
                    await removeCloudWebExports(attemptedPaths);
                    messages.push({ key: "admin.upload.cleanupRemoved" });
                } catch (cleanupError) {
                    needsReview = true;
                    messages.push({ key: "admin.upload.cleanupFailed" });
                    messages.push(...errorParts(cleanupError, false));
                }
            }
            if (needsReview) {
                messages.push({ key: "admin.queue.needsReview" });
                messages.push({ key: "admin.upload.cleanupPaths", values: {
                    bucket: CLOUD_WEB_BUCKET,
                    paths: attemptedPaths.join(", ")
                } });
            }
            showUploadProgress(kind, "admin.upload.stopped", uploadedPaths.length);
            options.onProgress?.(needsReview ? "needsReview" : "failed", uploadedPaths.length);
        }
        showAdminStatusParts(messages, true);
        return null;
    }
}

workForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (workSaving || gallerySaving || bulkSaving || queueSaving) return;
    if (unresolvedUploadStatus.work) {
        showAdminStatusParts(unresolvedUploadStatus.work.parts, true);
        return;
    }

    const { id, values } = getFormValues(workForm, ["order", "coverWidth", "coverHeight"]);
    const selectedFile = cloudMode ? imageControls.work.file.files[0] : null;
    const disabledControls = [...workForm.elements].map((field) => [field, field.disabled]);
    workSaving = true;
    disabledControls.forEach(([field]) => { field.disabled = true; });
    if (cloudMode) signOutButton.disabled = true;
    syncImageFields("work");

    try {
        const duplicateSlug = (await adminStore.getWorks())
            .some((work) => work.slug === values.slug && work.id !== id);
        if (duplicateSlug) {
            showAdminStatus("admin.works.duplicateSlug", true);
            return;
        }
        const saved = await saveImageRecord("work", id, values, selectedFile);
        if (!saved) {
            if (selectedFile && uploadNeedsReview()) unresolvedUploadStatus.work = currentStatus;
            return;
        }

        resetWorkForm();
        try {
            await renderAdmin();
            showAdminStatus(id ? selectedFile ? "admin.works.updatedWithFile" : "admin.works.updated"
                : selectedFile ? "admin.works.createdWithFile" : "admin.works.created");
        } catch (error) {
            showAdminStatusParts([...errorParts(error), { key: "admin.upload.rowSavedListStale" }], true);
        }
    } catch (error) {
        showAdminError(error);
    } finally {
        workSaving = false;
        disabledControls.forEach(([field, wasDisabled]) => { field.disabled = wasDisabled; });
        if (cloudMode) signOutButton.disabled = workSaving || gallerySaving;
        syncImageFields("work");
    }
});

galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (gallerySaving || workSaving || bulkSaving || queueSaving) return;

    if (selectedQueueId) {
        saveQueueDraftFromForm();
        showAdminStatus("admin.queue.draftSaved");
        return;
    }
    if (unresolvedUploadStatus.gallery) {
        showAdminStatusParts(unresolvedUploadStatus.gallery.parts, true);
        return;
    }
    if (cloudMode && !galleryForm.elements.id.value) {
        showAdminStatus("admin.queue.chooseFirst", true);
        return;
    }

    const id = galleryForm.elements.id.value;
    const values = readPhotoFormValues();
    if (!values.category) {
        galleryForm.elements.category.value = "";
        galleryForm.elements.category.reportValidity();
        return;
    }
    const selectedFile = cloudMode ? imageControls.gallery.file.files[0] : null;
    const disabledControls = [...galleryForm.elements].map((field) => [field, field.disabled]);
    gallerySaving = true;
    disabledControls.forEach(([field]) => { field.disabled = true; });
    if (cloudMode) signOutButton.disabled = true;
    syncImageFields("gallery");

    try {
        if (!values.collectionId) {
            values.collectionOrder = null;
        } else if (!(await adminStore.getWorks()).some((work) => work.id === values.collectionId)) {
            showAdminStatus("admin.gallery.unknownCollection", true);
            return;
        }
        const saved = await saveImageRecord("gallery", id, values, selectedFile);
        if (!saved) {
            if (selectedFile && uploadNeedsReview()) unresolvedUploadStatus.gallery = currentStatus;
            return;
        }

        resetGalleryForm();
        try {
            await renderGalleryAdmin();
            showAdminStatus(id ? selectedFile ? "admin.gallery.updatedWithFile" : "admin.gallery.updated"
                : selectedFile ? "admin.gallery.createdWithFiles" : "admin.gallery.created");
        } catch (error) {
            showAdminStatusParts([...errorParts(error), { key: "admin.upload.rowSavedListStale" }], true);
        }
    } catch (error) {
        showAdminError(error);
    } finally {
        gallerySaving = false;
        disabledControls.forEach(([field, wasDisabled]) => { field.disabled = wasDisabled; });
        if (cloudMode) signOutButton.disabled = workSaving || gallerySaving;
        syncImageFields("gallery");
    }
});

workList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !workList.contains(button)) return;
    if (workSaving || gallerySaving || bulkSaving || queueSaving) {
        showAdminStatus("admin.works.waitSave");
        return;
    }

    let collectionDeleted = false;
    try {
        const work = await adminStore.getWorkById(button.dataset.id);
        if (!work) return;

        if (button.dataset.action === "edit") {
            imageControls.work.file.value = "";
            fillForm(workForm, work);
            document.querySelector("#work-form-title").textContent = adminT("admin.works.editTitle");
            cancelWorkEdit.hidden = false;
            imageControls.work.progress.hidden = true;
            currentUploadProgress.work = null;
            renderImagePreview("work");
            syncImageFields("work");
            membershipCollection.value = work.id;
            selectedMembershipIds.clear();
            membershipOrderDraft = null;
            renderMembershipList();
            renderPhotoQueue();
            workForm.scrollIntoView({ behavior: "smooth", block: "start" });
            workForm.elements.title.focus({ preventScroll: true });
            return;
        }

        const linkedBefore = (await adminStore.getGalleryItems())
            .filter((photo) => photo.collectionId === work.id);
        if (!window.confirm(adminT("admin.works.deleteWithPhotosConfirm", {
            title: adminI18n.content(work, "title") || work.id,
            count: linkedBefore.length
        }))) return;

        if (!await adminStore.deleteWork(work.id)) throw localizedError("admin.works.deleteFailed");
        collectionDeleted = true;
        resetWorkForm();
        await renderAdmin();
        const after = new Map((currentGalleryItems || []).map((photo) => [photo.id, photo]));
        if (linkedBefore.some((photo) => !after.has(photo.id) || after.get(photo.id).collectionId === work.id)) {
            showAdminStatus("admin.works.deleteCheckFailed", true);
        } else {
            showAdminStatus("admin.works.deletedDetached", false, { count: linkedBefore.length });
        }
    } catch (error) {
        try {
            if (button.dataset.action === "delete") await renderAdmin();
        } catch (reloadError) {
            showAdminStatusParts([
                ...(collectionDeleted ? [{ key: "admin.works.deleteCheckFailed" }] : errorParts(error)),
                ...errorParts(reloadError)
            ], true);
            return;
        }
        if (collectionDeleted) {
            showAdminStatusParts([{ key: "admin.works.deleteCheckFailed" }, ...errorParts(error)], true);
        } else {
            showAdminError(error);
        }
    }
});

galleryList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !galleryList.contains(button)) return;
    if (gallerySaving || workSaving || bulkSaving || queueSaving) {
        showAdminStatus("admin.gallery.waitSave");
        return;
    }

    try {
        const item = await adminStore.getGalleryItemById(button.dataset.id);
        if (!item) return;

        if (button.dataset.action === "edit") {
            saveQueueDraftFromForm();
            resetGalleryForm();
            imageControls.gallery.file.value = "";
            clearExifReview();
            fillForm(galleryForm, item);
            document.querySelector("#gallery-form-title").textContent = adminT("admin.gallery.editTitle");
            cancelGalleryEdit.hidden = false;
            imageControls.gallery.progress.hidden = true;
            currentUploadProgress.gallery = null;
            renderImagePreview("gallery");
            syncImageFields("gallery");
            galleryForm.scrollIntoView({ behavior: "smooth", block: "start" });
            galleryForm.elements.title.focus({ preventScroll: true });
            return;
        }

        if (!window.confirm(adminT(cloudMode
            ? "admin.gallery.deleteConfirmCloud"
            : "admin.gallery.deleteConfirm", { title: adminI18n.content(item, "title") || item.id }))) return;

        if (!await adminStore.deleteGalleryItem(item.id)) throw localizedError("admin.gallery.deleteFailed");
        resetGalleryForm();
        await renderGalleryAdmin();
        showAdminStatus(cloudMode ? "admin.gallery.cloudDeleted" : "admin.gallery.deleted");
    } catch (error) {
        showAdminError(error);
    }
});

cancelWorkEdit.addEventListener("click", resetWorkForm);
cancelGalleryEdit.addEventListener("click", () => {
    saveQueueDraftFromForm();
    resetGalleryForm();
    renderPhotoQueue();
});
galleryForm.addEventListener("input", saveQueueDraftFromForm);
galleryForm.addEventListener("change", saveQueueDraftFromForm);
Object.entries(imageControls).forEach(([kind, control]) => {
    function refreshSelection() {
        control.progress.hidden = true;
        currentUploadProgress[kind] = null;
        renderImagePreview(kind);
        if (kind === "gallery") readSelectedPhotoExif(control.file.files[0]);
    }
    control.file.addEventListener("change", refreshSelection);
    control.clear.addEventListener("click", () => {
        control.file.value = "";
        refreshSelection();
    });
});

batchPhotoFiles.addEventListener("change", () => {
    if (!cloudMode || queueSaving) return;
    const collection = currentWorks?.find((work) => work.id === membershipCollection.value);
    if (!collection) {
        batchPhotoFiles.value = "";
        showAdminStatus("admin.queue.collectionRequired", true);
        return;
    }
    const files = [...batchPhotoFiles.files];
    const maxGlobal = Math.max(0, ...(currentGalleryItems || []).map((photo) =>
        Number.isFinite(photo.order) ? photo.order : 0));
    const maxCollection = Math.max(0, ...orderedCollectionPhotos(collection.id).map((photo) =>
        Number.isFinite(photo.collectionOrder) ? photo.collectionOrder : 0));
    const previousQueue = photoQueue.filter((item) => item.values.collectionId === collection.id).length;
    const added = files.map((file, index) => {
        let fileError = "";
        try {
            validateCloudImageFile(file);
        } catch (error) {
            fileError = error.translationKey
                ? adminT(error.translationKey, error.translationValues || {}) : error.message;
        }
        return {
            id: createContentId("photo"),
            file,
            previewUrl: URL.createObjectURL(file),
            values: {
            title: "", alt: "", src: "", fullSrc: "", srcset: "",
            category: collection.category || "", collectionId: collection.id,
            order: maxGlobal + photoQueue.length + index + 1,
            collectionOrder: maxCollection + previousQueue + index + 1,
            date: "", captureTime: "", location: "", tags: [],
            description: "", camera: "", lens: "", focalLength: "",
            aperture: "", shutterSpeed: "", iso: "", width: "", height: ""
            },
            status: fileError ? "failed" : "draft", progress: 0, error: fileError
        };
    });
    photoQueue.push(...added);
    batchPhotoFiles.value = "";
    renderPhotoQueue();
    const firstValid = added.find((item) => item.status === "draft");
    if (firstValid) selectQueuePhoto(firstValid.id);
});
batchUploadList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-queue-action]");
    if (!button || !batchUploadList.contains(button) || queueSaving) return;
    if (button.dataset.queueAction === "edit") selectQueuePhoto(button.dataset.id);
    if (button.dataset.queueAction === "remove") {
        const item = photoQueue.find((photo) => photo.id === button.dataset.id);
        if (item) forgetQueueItem(item);
    }
});
batchUploadAll.addEventListener("click", () => uploadQueueItems(photoQueue.filter((item) =>
    item.status === "draft" || item.status === "failed")));
batchRetryFailed.addEventListener("click", () => uploadQueueItems(photoQueue.filter((item) =>
    item.status === "failed")));
batchClearDone.addEventListener("click", () => {
    photoQueue.filter((item) => item.status === "success").forEach(forgetQueueItem);
});

membershipCollection.addEventListener("change", () => {
    selectedMembershipIds.clear();
    membershipOrderDraft = null;
    renderMembershipList();
    renderPhotoQueue();
});
membershipSearch.addEventListener("input", renderMembershipList);
membershipList.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox || !membershipList.contains(checkbox)) return;
    if (checkbox.checked) selectedMembershipIds.add(checkbox.value);
    else selectedMembershipIds.delete(checkbox.value);
    renderMembershipList();
});
membershipList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-order]");
    if (!button || !membershipList.contains(button) || bulkSaving) return;
    const index = membershipOrderDraft?.indexOf(button.dataset.id) ?? -1;
    const nextIndex = index + (button.dataset.order === "up" ? -1 : 1);
    if (index < 0 || nextIndex < 0 || nextIndex >= membershipOrderDraft.length) return;
    [membershipOrderDraft[index], membershipOrderDraft[nextIndex]] = [
        membershipOrderDraft[nextIndex], membershipOrderDraft[index]
    ];
    renderMembershipList();
});

membershipAdd.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    if (!selectedMembershipIds.size) return showAdminStatus("admin.membership.nothingSelected", true);
    const collectionId = membershipCollection.value;
    if (!collectionId) return;
    setBulkSaving(true);
    try {
        const photos = await adminStore.getGalleryItems();
        const selected = photos.filter((photo) => selectedMembershipIds.has(photo.id)
            && photo.collectionId !== collectionId);
        if (!selected.length) return showAdminStatus("admin.membership.noOrderChanges");
        if (!window.confirm(adminT("admin.membership.addFieldsConfirm", {
            count: selected.length, title: collectionName(collectionId)
        }))) return;
        const existing = photos.filter((photo) => photo.collectionId === collectionId);
        const maxOrder = Math.max(0, ...existing.map((photo) => Number.isFinite(photo.collectionOrder)
            ? photo.collectionOrder : Number.isFinite(photo.order) ? photo.order : 0));
        const positions = new Map(selected.map((photo, index) => [photo.id, maxOrder + index + 1]));
        await savePhotoBatch(selected, (photo) => ({
            collectionId,
            collectionOrder: positions.get(photo.id)
        }), "admin.membership.saved");
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

membershipRemove.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    if (!selectedMembershipIds.size) return showAdminStatus("admin.membership.nothingSelected", true);
    const collectionId = membershipCollection.value;
    setBulkSaving(true);
    try {
        const photos = await adminStore.getGalleryItems();
        const selected = photos.filter((photo) => selectedMembershipIds.has(photo.id)
            && photo.collectionId === collectionId);
        if (!selected.length) return showAdminStatus("admin.membership.nothingToRemove", true);
        if (!window.confirm(adminT("admin.membership.removeFieldsConfirm", {
            count: selected.length
        }))) return;
        await savePhotoBatch(selected, (photo) => photo.collectionId === collectionId
            ? { collectionId: null, collectionOrder: null } : null, "admin.membership.saved");
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

membershipSaveOrder.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const collectionId = membershipCollection.value;
    const originalIds = orderedCollectionPhotos(collectionId).map((photo) => photo.id);
    if (!membershipOrderDraft || originalIds.every((id, index) => id === membershipOrderDraft[index])) {
        return showAdminStatus("admin.membership.noOrderChanges");
    }
    const photos = membershipOrderDraft.map((id) => currentGalleryItems.find((photo) => photo.id === id));
    const position = new Map(membershipOrderDraft.map((id, index) => [id, index + 1]));
    if (!window.confirm(adminT("admin.membership.orderFieldsConfirm", {
        count: photos.length
    }))) return;
    setBulkSaving(true);
    try {
        await savePhotoBatch(photos, (photo) => {
            if (photo.collectionId !== collectionId) throw new Error(`Photo ${photo.id} changed collections. Recheck the list.`);
            return { collectionOrder: position.get(photo.id) };
        }, "admin.membership.orderSaved");
    } finally {
        setBulkSaving(false);
    }
});

membershipSetCategory.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const categoryId = membershipCategory.value;
    if (!categoryId || !currentCategories?.some((item) => item.id === categoryId)) {
        return showAdminStatus("admin.queue.categoryRequired", true);
    }
    const selected = (currentGalleryItems || []).filter((photo) =>
        selectedMembershipIds.has(photo.id) && photo.category !== categoryId);
    if (!selected.length) return showAdminStatus("admin.membership.noOrderChanges");
    if (!window.confirm(adminT("admin.membership.categoryFieldsConfirm", {
        count: selected.length, category: categoryName(categoryId)
    }))) return;
    await savePhotoBatch(selected, () => ({ category: categoryId }),
        "admin.membership.categorySaved");
});

async function deletePhotoBatch(photos) {
    setBulkSaving(true);
    batchResults.replaceChildren();
    const failed = [];
    let deleted = 0;
    for (const [index, photo] of photos.entries()) {
        const row = appendBatchResult(photo, "admin.membership.deletingOne", {
            current: index + 1, total: photos.length
        });
        try {
            const latest = await adminStore.getGalleryItemById(photo.id);
            if (latest && !await adminStore.deleteGalleryItem(photo.id)) {
                throw localizedError("admin.gallery.deleteFailed");
            }
            deleted++;
            row.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.deletedOne")}`;
        } catch (error) {
            // An ambiguous response may follow a committed delete. A retry must not
            // recreate anything or report a missing row as a failed deletion.
            try {
                if (!await adminStore.getGalleryItemById(photo.id)) {
                    deleted++;
                    row.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.deletedOne")}`;
                    continue;
                }
            } catch { /* Keep this item in the retry list. */ }
            failed.push(photo);
            row.textContent = `${photo.title || photo.id}: ${adminT("admin.membership.failedOne", {
                message: error.message || String(error)
            })}`;
        }
    }
    selectedMembershipIds = new Set(failed.map((photo) => photo.id));
    lastBatchRetry = failed.length ? () => deletePhotoBatch(failed) : null;
    batchRetryUpdates.hidden = !lastBatchRetry;
    try {
        await renderGalleryAdmin();
        showAdminStatus(failed.length ? "admin.membership.deletePartial"
            : "admin.membership.deleteDone", Boolean(failed.length), {
            deleted, failed: failed.length
        });
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
}

membershipDelete.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const selected = (currentGalleryItems || []).filter((photo) =>
        selectedMembershipIds.has(photo.id));
    if (!selected.length) return showAdminStatus("admin.membership.nothingSelected", true);
    if (!window.confirm(adminT("admin.membership.deleteConfirm", { count: selected.length }))) return;
    await deletePhotoBatch(selected);
});

batchRetryUpdates.addEventListener("click", () => {
    if (!bulkSaving && lastBatchRetry) lastBatchRetry();
});

categoryCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const name = categoryCreateForm.elements.name.value.trim();
    if (!name) return;
    try {
        const created = await adminStore.createCategory(name);
        if (!created) throw localizedError("admin.categories.saveFailed");
        categoryCreateForm.reset();
        await renderAdmin();
        showAdminStatus("admin.categories.created", false, { name });
    } catch (error) {
        showAdminError(error);
    }
});

categoryRenameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const source = categoryRenameForm.elements.source.value;
    const target = categoryRenameForm.elements.target.value.trim();
    if (!target) return;
    const oldName = categoryName(source);
    if (oldName === target) return showAdminStatus("admin.categories.same", true);
    const worksCount = (currentWorks || []).filter((work) => work.category === source).length;
    const photosCount = (currentGalleryItems || []).filter((photo) => photo.category === source).length;
    if (!window.confirm(adminT("admin.categories.renameConfirm", {
        source: oldName, target, works: worksCount, photos: photosCount
    }))) return;
    setBulkSaving(true);
    try {
        const saved = await adminStore.renameCategory(source, target);
        if (!saved) throw localizedError("admin.categories.saveFailed");
        categoryRenameForm.elements.target.value = "";
        await renderAdmin();
        showAdminStatus("admin.categories.renamed", false, { target });
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

categoryMergeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const source = categoryMergeForm.elements.source.value;
    const target = categoryMergeForm.elements.target.value;
    if (!source || !target || source === target) return showAdminStatus("admin.categories.same", true);
    const worksCount = (currentWorks || []).filter((work) => work.category === source).length;
    const photosCount = (currentGalleryItems || []).filter((photo) => photo.category === source).length;
    if (!window.confirm(adminT("admin.categories.mergeConfirm", {
        source: categoryName(source), target: categoryName(target),
        works: worksCount, photos: photosCount
    }))) return;
    setBulkSaving(true);
    try {
        if (!await adminStore.mergeCategories(source, target)) {
            throw localizedError("admin.categories.saveFailed");
        }
        await renderAdmin();
        showAdminStatus("admin.categories.merged", false, { target: categoryName(target) });
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

categoryDelete.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving || queueSaving) return showAdminStatus("admin.membership.busy");
    const id = categoryDeleteTarget.value;
    if (!id) return;
    const name = categoryName(id);
    if (!window.confirm(adminT("admin.categories.deleteConfirm", { name }))) return;
    setBulkSaving(true);
    try {
        if (!await adminStore.deleteUnusedCategory(id)) throw localizedError("admin.categories.deleteFailed");
        await renderAdmin();
        showAdminStatus("admin.categories.deleted", false, { name });
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

exifReviewFields.addEventListener("input", (event) => {
    const fieldName = event.target.dataset.exifField;
    if (!fieldName || !exifFieldNames.includes(fieldName)) return;
    exifCandidates[fieldName] = event.target.value;
    exifDecisions[fieldName] = "pending";
    exifReviewFields.querySelector(`[data-exif-decision="${fieldName}"]`).textContent =
        adminT(`admin.exif.${event.target.value ? "pending" : "missing"}`);
});
exifReviewFields.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-exif-action]");
    if (!button || !exifReviewFields.contains(button)) return;
    const fieldName = button.dataset.exifField;
    if (!exifFieldNames.includes(fieldName)) return;
    const input = exifReviewFields.querySelector(`#exif-candidate-${fieldName}`);
    if (button.dataset.exifAction === "accept") {
        galleryForm.elements[fieldName].value = input.value;
        exifDecisions[fieldName] = "accepted";
    } else if (button.dataset.exifAction === "reject") {
        exifDecisions[fieldName] = "rejected";
    } else {
        input.value = "";
        exifCandidates[fieldName] = "";
        exifDecisions[fieldName] = "missing";
    }
    exifReviewFields.querySelector(`[data-exif-decision="${fieldName}"]`).textContent =
        adminT(`admin.exif.${exifDecisions[fieldName]}`);
});

resetContentButton.addEventListener("click", async () => {
    if (cloudMode) return;
    const confirmed = window.confirm(adminT("admin.reset.confirm"));

    if (!confirmed) return;

    if (contentService.resetAllContent()) {
        resetWorkForm();
        resetGalleryForm();
        await renderAdmin();
        showAdminStatus("admin.reset.restored");
    } else {
        showAdminStatus("admin.reset.failed", true);
    }
});

function setAdminAccess(allowed) {
    adminAccessAllowed = allowed;
    document.querySelector("#works-admin").hidden = !allowed;
    document.querySelector("#photo-upload-queue").hidden = !cloudMode || !allowed;
    resetSection.hidden = cloudMode || !allowed;
    document.querySelectorAll(".admin-nav li").forEach((item, index) => {
        if (index === 0) item.hidden = !allowed;
    });

    if (cloudMode) {
        authSection.hidden = false;
        authHeading.textContent = adminT(allowed ? "admin.auth.sessionTitle" : "admin.auth.signInTitle");
        loginForm.hidden = allowed;
        signOutButton.hidden = !allowed;
    }
}

async function initializeCloudAdmin() {
    const generation = ++cloudAccessGeneration;
    setAdminAccess(false);

    try {
        const client = await getSupabaseClient();
        const { data: userData } = await client.auth.getUser();
        if (generation !== cloudAccessGeneration) return;

        if (!userData?.user) {
            showAdminStatus("admin.auth.signInRequired");
            return;
        }

        const { data: allowed, error } = await client.rpc("is_portfolio_admin");
        if (generation !== cloudAccessGeneration) return;
        if (error) throw error;
        if (allowed !== true) {
            showAdminStatus("admin.auth.notOwner", true);
            return;
        }

        setAdminAccess(true);
        await renderAdmin();
        const requestedSection = document.getElementById(window.location.hash.slice(1));
        if (requestedSection?.id === "works-admin") {
            requestedSection.scrollIntoView();
        }
        showAdminStatus("admin.auth.cloudLoaded");
    } catch (error) {
        if (generation !== cloudAccessGeneration) return;
        setAdminAccess(false);
        showAdminStatus("admin.auth.cloudUnavailable", true, { message: error.message });
    }
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!cloudMode) return;

    try {
        const client = await getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({
            email: loginForm.elements.email.value,
            password: loginForm.elements.password.value
        });
        loginForm.elements.password.value = "";
        if (error) throw error;
        await initializeCloudAdmin();
    } catch (error) {
        loginForm.elements.password.value = "";
        showAdminStatus("admin.auth.signInFailed", true, { message: error.message });
    }
});

signOutButton.addEventListener("click", async () => {
    if (!cloudMode) return;

    try {
        const client = await getSupabaseClient();
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw error;
        cloudAccessGeneration++;
        setAdminAccess(false);
        showAdminStatus("admin.auth.signedOut");
    } catch (error) {
        showAdminStatus("admin.auth.signOutFailed", true, { message: error.message });
    }
});

function updateAdminLanguage() {
    document.title = adminT("admin.seo.title");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = adminT("admin.seo.description");
    document.querySelector("#admin-mode-label").textContent = adminT(
        cloudMode ? "admin.mode.cloudLabel" : "admin.mode.localLabel"
    );
    document.querySelector("#admin-intro-copy").textContent = adminT(
        cloudMode ? "admin.mode.cloudIntro" : "admin.mode.localIntro"
    );
    authHeading.textContent = adminT(
        adminAccessAllowed ? "admin.auth.sessionTitle" : "admin.auth.signInTitle"
    );
    document.querySelector("#work-form-title").textContent = adminT(
        workForm.elements.id.value ? "admin.works.editTitle" : "admin.works.createTitle"
    );
    document.querySelector("#gallery-form-title").textContent = adminT(
        galleryForm.elements.id.value ? "admin.gallery.editTitle" : "admin.gallery.createTitle"
    );
    document.querySelector("#gallery-upload-label").textContent = adminT(
        cloudMode ? "admin.fields.photoImage" : "admin.fields.exifSourceFile"
    );
    document.querySelector("#gallery-upload-hint").textContent = adminT(
        cloudMode ? "admin.upload.imageHint" : "admin.upload.localPhotoHint"
    );
    if (currentWorks) renderWorksList(currentWorks);
    if (currentGalleryItems) renderGalleryList(currentGalleryItems);
    renderAdminBatchControls();
    renderPhotoQueue();
    if (exifReviewData) renderExifReview();
    else if (!exifReviewSection.hidden) exifReviewStatus.textContent = adminT("admin.exif.reading");
    renderAdminStatus();
    Object.keys(imageControls).forEach((kind) => {
        renderUploadProgress(kind);
        if (!imageControls[kind].preview.hidden) {
            imageControls[kind].previewCaption.textContent = adminT(
                imageControls[kind].file.files.length
                    ? "admin.upload.selectedPreview" : "admin.upload.currentPreview"
            );
        }
    });
}

adminI18n.onChange(updateAdminLanguage);
updateAdminLanguage();
document.querySelector("#admin-file-notice").hidden = !openedAsFile;

if (cloudMode) {
    syncImageFields("work");
    syncImageFields("gallery");
    setAdminAccess(false);
    if (openedAsFile) {
        authSection.hidden = true;
    } else {
        getSupabaseClient().then((client) => {
            client.auth.onAuthStateChange((event) => {
                if (event === "SIGNED_OUT") {
                    cloudAccessGeneration++;
                    setAdminAccess(false);
                }
            });
            initializeCloudAdmin();
        }).catch((error) => showAdminStatus("admin.auth.cloudUnavailable", true, { message: error.message }));
    }
} else {
    syncImageFields("work");
    syncImageFields("gallery");
    setAdminAccess(true);
    renderAdmin().catch(showAdminError);
}
