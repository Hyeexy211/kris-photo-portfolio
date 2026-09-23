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
const workIdOptions = document.querySelector("#work-id-options");
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
const categoryRenameForm = document.querySelector("#category-rename-form");
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
    galleryForm.reset();
    galleryForm.elements.id.value = "";
    document.querySelector("#gallery-form-title").textContent = adminT("admin.gallery.createTitle");
    cancelGalleryEdit.hidden = true;
    clearExifReview();
    resetImageControl("gallery");
}

function syncImageFields(kind) {
    const { form, field, file, clear } = imageControls[kind];
    field.hidden = kind === "work" && !cloudMode;
    form.querySelectorAll(".admin-manual-image-field").forEach((label) => {
        label.hidden = cloudMode;
    });
    const requiredFields = kind === "work" ? ["cover"] : ["src", "fullSrc"];
    requiredFields.forEach((fieldName) => {
        form.elements[fieldName].required = !cloudMode;
    });
    file.disabled = (kind === "work" && !cloudMode) || (kind === "work" ? workSaving : gallerySaving);
    clear.disabled = file.disabled;
}

function renderImagePreview(kind) {
    const control = imageControls[kind];
    const selectedFile = control.file.files[0];
    if (previewObjectUrls[kind]) URL.revokeObjectURL(previewObjectUrls[kind]);
    previewObjectUrls[kind] = null;
    control.clear.hidden = !selectedFile;
    control.fileName.textContent = selectedFile?.name || "";

    if (selectedFile) {
        try {
            validateCloudImageFile(selectedFile);
        } catch (error) {
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

    const optionFragment = document.createDocumentFragment();
    works.forEach((work) => {
        const option = document.createElement("option");
        option.value = work.id;
        option.label = adminI18n.content(work, "title") || work.id;
        optionFragment.appendChild(option);
    });
    workIdOptions.replaceChildren(optionFragment);
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
                    category: adminI18n.category(item.category) || adminT("admin.none"),
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
    await Promise.all([renderWorksAdmin(), renderGalleryAdmin()]);
    renderAdminBatchControls();
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
}

function renderCategoryOptions() {
    const categories = [...new Set((currentGalleryItems || [])
        .map((photo) => String(photo.category || "")).filter((category) => category.trim()))]
        .sort((a, b) => a.localeCompare(b, adminI18n.getLanguage()));
    const source = categoryRenameForm.elements.source;
    const chosen = source.value;
    const sourceOptions = document.createDocumentFragment();
    const datalistOptions = document.createDocumentFragment();
    const photoFormOptions = document.createDocumentFragment();
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = adminI18n.category(category) || category;
        sourceOptions.appendChild(option);
        const targetOption = document.createElement("option");
        targetOption.value = category;
        datalistOptions.appendChild(targetOption);
        photoFormOptions.appendChild(targetOption.cloneNode());
    });
    source.replaceChildren(sourceOptions);
    if (categories.includes(chosen)) source.value = chosen;
    document.querySelector("#category-merge-options").replaceChildren(datalistOptions);
    document.querySelector("#gallery-category-options").replaceChildren(photoFormOptions);
    source.disabled = categories.length === 0 || bulkSaving;
    categoryRenameForm.querySelector('button[type="submit"]').disabled = categories.length === 0 || bulkSaving;
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
        const category = adminI18n.category(photo.category) || photo.category || "";
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
        meta.textContent = `${adminI18n.category(photo.category) || photo.category || adminT("admin.none")} · ${belonging}`;
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
    if (cloudMode) signOutButton.disabled = saving || workSaving || gallerySaving;
}

async function savePhotoBatch(photos, changePhoto, successKey, successValues = {},
    partialKey = "admin.membership.partial") {
    setBulkSaving(true);
    let savedCount = 0;
    let writeError = null;
    for (const photo of photos) {
        try {
            const latest = await adminStore.getGalleryItemById(photo.id);
            if (!latest) throw new Error(`Photo ${photo.id} no longer exists.`);
            const changes = changePhoto(latest, savedCount);
            if (!changes) continue;
            const saved = await adminStore.updateGalleryItem(latest.id, changes);
            if (!saved) throw localizedError("admin.gallery.saveFailed");
            savedCount++;
        } catch (error) {
            writeError = error;
            break;
        }
    }

    selectedMembershipIds.clear();
    membershipOrderDraft = null;
    try {
        await renderGalleryAdmin();
        if (writeError) {
            showAdminStatus(partialKey, true, {
                count: savedCount,
                message: writeError.translationKey
                    ? adminT(writeError.translationKey) : writeError.message || String(writeError)
            });
        } else {
            showAdminStatus(successKey, false, { count: savedCount, ...successValues });
        }
    } catch (reloadError) {
        showAdminStatus("admin.membership.reloadFailed", true, {
            message: `${writeError?.message || ""} ${reloadError.message || String(reloadError)}`.trim()
        });
    } finally {
        setBulkSaving(false);
    }
    return { savedCount, writeError };
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

async function saveImageRecord(kind, id, values, selectedFile) {
    const isWork = kind === "work";
    const recordId = id || createContentId(isWork ? "work" : "photo");
    const uploadedPaths = [];
    const accessGeneration = cloudAccessGeneration;
    let databaseWriteAttempted = false;
    let uploadedUrl = "";

    try {
        if (cloudMode && !id && !selectedFile) {
            throw localizedError("admin.upload.imageRequired");
        }
        if (selectedFile) {
            if (!isWork) await exifReviewPromise;
            showUploadProgress(kind, "admin.upload.preparing", 0);
            const exports = await prepareCloudWebExports(selectedFile);
            const images = await uploadCloudWebExports(
                isWork ? "collections" : "photos", recordId, exports, (path) => {
                    uploadedPaths.push(path);
                    showUploadProgress(kind, "admin.upload.filesUploaded", uploadedPaths.length, {
                        count: uploadedPaths.length
                    });
                }
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
        if (uploadedPaths.length > 0) {
            let cleanupIsSafe = true;
            if (databaseWriteAttempted) {
                try {
                    if (await cloudAdminService.imageRowUsesUrl(
                        isWork ? "collections" : "photos", recordId, uploadedUrl
                    )) {
                        cleanupIsSafe = false;
                        messages.push({ key: "admin.upload.rowUsesFilesKept" });
                    }
                } catch {
                    cleanupIsSafe = false;
                    messages.push({ key: "admin.upload.rowCheckFailedFilesKept" });
                }
            }
            if (cleanupIsSafe) {
                try {
                    await removeCloudWebExports(uploadedPaths);
                    messages.push({ key: "admin.upload.cleanupRemoved" });
                } catch (cleanupError) {
                    messages.push({ key: "admin.upload.cleanupFailed" });
                    messages.push(...errorParts(cleanupError, false));
                    messages.push({ key: "admin.upload.cleanupPaths", values: {
                        bucket: CLOUD_WEB_BUCKET,
                        paths: uploadedPaths.join(", ")
                    } });
                }
            }
            showUploadProgress(kind, "admin.upload.stopped", uploadedPaths.length);
        }
        showAdminStatusParts(messages, true);
        return null;
    }
}

workForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (workSaving || gallerySaving || bulkSaving) return;

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
        if (!saved) return;

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
    if (gallerySaving || workSaving || bulkSaving) return;

    const { id, values } = getFormValues(galleryForm, ["order", "collectionOrder", "width", "height"]);
    values.category = values.category.trim();
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
        values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
        values.collectionId = values.collectionId.trim() || null;
        if (!values.collectionId) {
            values.collectionOrder = null;
        } else if (!(await adminStore.getWorks()).some((work) => work.id === values.collectionId)) {
            showAdminStatus("admin.gallery.unknownCollection", true);
            return;
        }
        const saved = await saveImageRecord("gallery", id, values, selectedFile);
        if (!saved) return;

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
    if (workSaving || gallerySaving || bulkSaving) {
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
    if (gallerySaving || workSaving || bulkSaving) {
        showAdminStatus("admin.gallery.waitSave");
        return;
    }

    try {
        const item = await adminStore.getGalleryItemById(button.dataset.id);
        if (!item) return;

        if (button.dataset.action === "edit") {
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
cancelGalleryEdit.addEventListener("click", resetGalleryForm);
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

membershipCollection.addEventListener("change", () => {
    selectedMembershipIds.clear();
    membershipOrderDraft = null;
    renderMembershipList();
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
    if (bulkSaving || workSaving || gallerySaving) return showAdminStatus("admin.membership.busy");
    if (!selectedMembershipIds.size) return showAdminStatus("admin.membership.nothingSelected", true);
    const collectionId = membershipCollection.value;
    if (!collectionId) return;
    setBulkSaving(true);
    try {
        const photos = await adminStore.getGalleryItems();
        const selected = photos.filter((photo) => selectedMembershipIds.has(photo.id)
            && photo.collectionId !== collectionId);
        if (!selected.length) return showAdminStatus("admin.membership.noOrderChanges");
        const moving = selected.filter((photo) => photo.collectionId).length;
        if (moving && !window.confirm(adminT("admin.membership.moveConfirm", { count: moving }))) return;
        const existing = photos.filter((photo) => photo.collectionId === collectionId);
        const maxOrder = Math.max(0, ...existing.map((photo) => Number.isFinite(photo.collectionOrder)
            ? photo.collectionOrder : Number.isFinite(photo.order) ? photo.order : 0));
        let nextOrder = maxOrder + 1;
        await savePhotoBatch(selected, (photo) => ({
            collectionId,
            collectionOrder: nextOrder++
        }), "admin.membership.saved");
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

membershipRemove.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving) return showAdminStatus("admin.membership.busy");
    if (!selectedMembershipIds.size) return showAdminStatus("admin.membership.nothingSelected", true);
    const collectionId = membershipCollection.value;
    setBulkSaving(true);
    try {
        const photos = await adminStore.getGalleryItems();
        const selected = photos.filter((photo) => selectedMembershipIds.has(photo.id)
            && photo.collectionId === collectionId);
        if (!selected.length) return showAdminStatus("admin.membership.nothingToRemove", true);
        await savePhotoBatch(selected, (photo) => photo.collectionId === collectionId
            ? { collectionId: null, collectionOrder: null } : null, "admin.membership.saved");
    } catch (error) {
        showAdminError(error);
    } finally {
        setBulkSaving(false);
    }
});

membershipSaveOrder.addEventListener("click", async () => {
    if (bulkSaving || workSaving || gallerySaving) return showAdminStatus("admin.membership.busy");
    const collectionId = membershipCollection.value;
    const originalIds = orderedCollectionPhotos(collectionId).map((photo) => photo.id);
    if (!membershipOrderDraft || originalIds.every((id, index) => id === membershipOrderDraft[index])) {
        return showAdminStatus("admin.membership.noOrderChanges");
    }
    const photos = membershipOrderDraft.map((id) => currentGalleryItems.find((photo) => photo.id === id));
    const position = new Map(membershipOrderDraft.map((id, index) => [id, index + 1]));
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

categoryRenameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (bulkSaving || workSaving || gallerySaving) return showAdminStatus("admin.membership.busy");
    const source = categoryRenameForm.elements.source.value;
    const target = categoryRenameForm.elements.target.value.trim();
    if (!target) return;
    if (source === target) return showAdminStatus("admin.categories.same", true);
    setBulkSaving(true);
    try {
        const photos = (await adminStore.getGalleryItems()).filter((photo) => photo.category === source);
        if (!photos.length) return renderGalleryAdmin();
        if (!window.confirm(adminT("admin.categories.confirm", {
            count: photos.length, source, target
        }))) return;
        const { writeError } = await savePhotoBatch(photos, (photo) => photo.category === source
            ? { category: target } : null, "admin.categories.saved", { target }, "admin.categories.partial");
        if (!writeError) categoryRenameForm.elements.target.value = "";
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
    document.querySelector("#gallery-admin").hidden = !allowed;
    resetSection.hidden = cloudMode || !allowed;
    document.querySelectorAll(".admin-nav li").forEach((item, index) => {
        if (index < 2) item.hidden = !allowed;
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
        if (requestedSection?.id === "works-admin" || requestedSection?.id === "gallery-admin") {
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
