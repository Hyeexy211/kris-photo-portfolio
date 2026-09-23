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
const galleryUploadField = document.querySelector("#gallery-upload-field");
const galleryUploadFile = document.querySelector("#gallery-upload-file");
const galleryUploadProgress = document.querySelector("#gallery-upload-progress");
const galleryUploadMessage = document.querySelector("#gallery-upload-message");
const galleryUploadCount = document.querySelector("#gallery-upload-count");
const adminI18n = window.siteI18n;
const adminT = (key, values) => adminI18n.t(key, values);
let cloudAccessGeneration = 0;
let gallerySaving = false;
let adminAccessAllowed = false;
let currentWorks = null;
let currentGalleryItems = null;
let currentStatus = null;
let currentUploadProgress = null;

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

function renderGalleryUploadProgress() {
    if (!currentUploadProgress) return;
    galleryUploadMessage.textContent = adminT(currentUploadProgress.key, currentUploadProgress.values);
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
}

function resetGalleryForm() {
    galleryForm.reset();
    galleryForm.elements.id.value = "";
    document.querySelector("#gallery-form-title").textContent = adminT("admin.gallery.createTitle");
    cancelGalleryEdit.hidden = true;
    galleryUploadProgress.hidden = true;
    currentUploadProgress = null;
    syncGalleryUploadFields();
}

function syncGalleryUploadFields() {
    const useUpload = cloudMode && !galleryForm.elements.id.value && galleryUploadFile.files.length > 0;
    galleryUploadField.hidden = !cloudMode || Boolean(galleryForm.elements.id.value);
    galleryUploadFile.disabled = gallerySaving || Boolean(galleryForm.elements.id.value);
    ["src", "fullSrc"].forEach((fieldName) => {
        galleryForm.elements[fieldName].required = !useUpload;
        galleryForm.elements[fieldName].readOnly = useUpload;
    });
    ["srcset", "width", "height"].forEach((fieldName) => {
        galleryForm.elements[fieldName].readOnly = useUpload;
    });
}

function showGalleryUploadProgress(key, completed, values = {}) {
    galleryUploadProgress.hidden = false;
    currentUploadProgress = { key, values };
    renderGalleryUploadProgress();
    galleryUploadCount.value = completed;
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

workForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const { id, values } = getFormValues(workForm, ["order", "coverWidth", "coverHeight"]);
        const duplicateSlug = (await adminStore.getWorks())
            .some((work) => work.slug === values.slug && work.id !== id);

        if (duplicateSlug) {
            showAdminStatus("admin.works.duplicateSlug", true);
            return;
        }

        const savedWork = id
            ? await adminStore.updateWork(id, values)
            : await adminStore.createWork(values);

        if (!savedWork) throw localizedError("admin.works.saveFailed");

        resetWorkForm();
        await renderAdmin();
        showAdminStatus(id ? "admin.works.updated" : "admin.works.created");
    } catch (error) {
        showAdminError(error);
    }
});

galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (gallerySaving) return;

    const { id, values } = getFormValues(galleryForm, ["order", "width", "height"]);
    const selectedFile = cloudMode ? galleryUploadFile.files[0] : null;
    const disabledControls = [...galleryForm.elements].map((field) => [field, field.disabled]);
    gallerySaving = true;
    disabledControls.forEach(([field]) => { field.disabled = true; });
    if (cloudMode) signOutButton.disabled = true;
    syncGalleryUploadFields();
    const uploadedPaths = [];
    let uploadPhotoId = "";
    let databaseInsertAttempted = false;
    let rowPublished = false;

    try {
        values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);

        if (selectedFile && id) {
            throw localizedError("admin.gallery.fileOnlyNew");
        }
        if (selectedFile) {
            uploadPhotoId = createContentId("photo");
            showGalleryUploadProgress("admin.upload.preparing", 0);
            const exports = await prepareCloudWebExports(selectedFile);
            const accessGeneration = cloudAccessGeneration;
            const images = await uploadCloudWebExports(uploadPhotoId, exports, (path) => {
                uploadedPaths.push(path);
                showGalleryUploadProgress("admin.upload.filesUploaded", uploadedPaths.length, {
                    count: uploadedPaths.length
                });
            });
            if (accessGeneration !== cloudAccessGeneration) {
                throw localizedError("admin.upload.sessionChanged");
            }
            Object.assign(values, {
                id: uploadPhotoId,
                src: images.src,
                fullSrc: images.fullSrc,
                srcset: images.srcset,
                width: images.width,
                height: images.height
            });
            showGalleryUploadProgress("admin.upload.savingRecord", 3);
            databaseInsertAttempted = true;
        }

        const savedItem = id
            ? await adminStore.updateGalleryItem(id, values)
            : await adminStore.createGalleryItem(values);

        if (!savedItem) throw localizedError("admin.gallery.saveFailed");
        rowPublished = true;

        resetGalleryForm();
        await renderGalleryAdmin();
        showAdminStatus(id ? "admin.gallery.updated" : selectedFile
            ? "admin.gallery.createdWithFiles"
            : "admin.gallery.created");
    } catch (error) {
        const messages = errorParts(error);
        if (rowPublished && uploadPhotoId) {
            messages.push({ key: "admin.gallery.rowSavedListStale" });
        }
        if (uploadedPaths.length > 0 && !rowPublished) {
            let cleanupIsSafe = true;
            if (databaseInsertAttempted) {
                try {
                    const existing = await cloudAdminService.photoRowExists(uploadPhotoId);
                    if (existing) {
                        cleanupIsSafe = false;
                        messages.push({ key: "admin.gallery.rowExistsFilesKept" });
                    }
                } catch {
                    cleanupIsSafe = false;
                    messages.push({ key: "admin.gallery.rowCheckFailedFilesKept" });
                }
            }
            if (cleanupIsSafe) {
                try {
                    await removeCloudWebExports(uploadedPaths);
                    messages.push({ key: "admin.gallery.cleanupRemoved" });
                } catch (cleanupError) {
                    messages.push({ key: "admin.gallery.cleanupFailed" });
                    messages.push(...errorParts(cleanupError, false));
                    messages.push({ key: "admin.gallery.cleanupPaths", values: {
                        bucket: CLOUD_WEB_BUCKET,
                        paths: uploadedPaths.join(", ")
                    } });
                }
            }
        }
        showAdminStatusParts(messages, true);
        if (uploadedPaths.length > 0) {
            showGalleryUploadProgress("admin.upload.stopped", uploadedPaths.length);
        }
    } finally {
        gallerySaving = false;
        disabledControls.forEach(([field, wasDisabled]) => { field.disabled = wasDisabled; });
        if (cloudMode) signOutButton.disabled = false;
        syncGalleryUploadFields();
    }
});

workList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !workList.contains(button)) return;

    try {
        const work = await adminStore.getWorkById(button.dataset.id);
        if (!work) return;

        if (button.dataset.action === "edit") {
            fillForm(workForm, work);
            document.querySelector("#work-form-title").textContent = adminT("admin.works.editTitle");
            cancelWorkEdit.hidden = false;
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
            galleryUploadFile.value = "";
            fillForm(galleryForm, item);
            document.querySelector("#gallery-form-title").textContent = adminT("admin.gallery.editTitle");
            cancelGalleryEdit.hidden = false;
            galleryUploadProgress.hidden = true;
            currentUploadProgress = null;
            syncGalleryUploadFields();
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
galleryUploadFile.addEventListener("change", syncGalleryUploadFields);

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
    renderGalleryUploadProgress();
}

adminI18n.onChange(updateAdminLanguage);
updateAdminLanguage();

if (cloudMode) {
    syncGalleryUploadFields();
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
    setAdminAccess(true);
    renderAdmin().catch(showAdminError);
}
