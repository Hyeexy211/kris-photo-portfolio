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
const cloudMode = new URLSearchParams(window.location.search).get("mode") === "cloud";
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
    resetImageControl("gallery");
}

function syncImageFields(kind) {
    const { form, field, file, clear } = imageControls[kind];
    field.hidden = !cloudMode;
    form.querySelectorAll(".admin-manual-image-field").forEach((label) => {
        label.hidden = cloudMode;
    });
    const requiredFields = kind === "work" ? ["cover"] : ["src", "fullSrc"];
    requiredFields.forEach((fieldName) => {
        form.elements[fieldName].required = !cloudMode;
    });
    file.disabled = !cloudMode || (kind === "work" ? workSaving : gallerySaving);
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
}

async function renderAdmin() {
    await Promise.all([renderWorksAdmin(), renderGalleryAdmin()]);
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
    if (workSaving || gallerySaving) return;

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
    if (gallerySaving || workSaving) return;

    const { id, values } = getFormValues(galleryForm, ["order", "width", "height"]);
    const selectedFile = cloudMode ? imageControls.gallery.file.files[0] : null;
    const disabledControls = [...galleryForm.elements].map((field) => [field, field.disabled]);
    gallerySaving = true;
    disabledControls.forEach(([field]) => { field.disabled = true; });
    if (cloudMode) signOutButton.disabled = true;
    syncImageFields("gallery");

    try {
        values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
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
    if (workSaving) {
        showAdminStatus("admin.works.waitSave");
        return;
    }

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
            workForm.scrollIntoView({ behavior: "smooth", block: "start" });
            workForm.elements.title.focus({ preventScroll: true });
            return;
        }

        if (!window.confirm(adminT(cloudMode
            ? "admin.works.deleteConfirmCloud"
            : "admin.works.deleteConfirm", { title: adminI18n.content(work, "title") || work.id }))) return;

        if (!await adminStore.deleteWork(work.id)) throw localizedError("admin.works.deleteFailed");
        resetWorkForm();
        await renderAdmin();
        showAdminStatus("admin.works.deleted");
    } catch (error) {
        showAdminError(error);
    }
});

galleryList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !galleryList.contains(button)) return;
    if (gallerySaving) {
        showAdminStatus("admin.gallery.waitSave");
        return;
    }

    try {
        const item = await adminStore.getGalleryItemById(button.dataset.id);
        if (!item) return;

        if (button.dataset.action === "edit") {
            imageControls.gallery.file.value = "";
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
    }
    control.file.addEventListener("change", refreshSelection);
    control.clear.addEventListener("click", () => {
        control.file.value = "";
        refreshSelection();
    });
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
    if (currentWorks) renderWorksList(currentWorks);
    if (currentGalleryItems) renderGalleryList(currentGalleryItems);
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

if (cloudMode) {
    syncImageFields("work");
    syncImageFields("gallery");
    setAdminAccess(false);
    getSupabaseClient().then((client) => {
        client.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                cloudAccessGeneration++;
                setAdminAccess(false);
            }
        });
        initializeCloudAdmin();
    }).catch((error) => showAdminStatus("admin.auth.cloudUnavailable", true, { message: error.message }));
} else {
    syncImageFields("work");
    syncImageFields("gallery");
    setAdminAccess(true);
    renderAdmin().catch(showAdminError);
}
