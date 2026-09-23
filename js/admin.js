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
const loginForm = document.querySelector("#admin-login-form");
const signOutButton = document.querySelector("#admin-sign-out");
const resetSection = document.querySelector("#admin-reset");
let cloudAccessGeneration = 0;

function showAdminStatus(message, isError = false) {
    adminStatus.textContent = message;
    adminStatus.classList.toggle("is-error", isError);
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
    document.querySelector("#work-form-title").textContent = "Create Work";
    cancelWorkEdit.hidden = true;
}

function resetGalleryForm() {
    galleryForm.reset();
    galleryForm.elements.id.value = "";
    document.querySelector("#gallery-form-title").textContent = "Create Gallery Item";
    cancelGalleryEdit.hidden = true;
}

function createAdminItem(item, metaText, itemType) {
    const row = document.createElement("article");
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    row.className = "admin-item";
    title.textContent = item.title || "Untitled";
    meta.textContent = metaText;
    actions.className = "admin-item-actions";

    editButton.className = "admin-button";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = item.id;
    editButton.textContent = "Edit";

    deleteButton.className = "admin-button admin-button-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${itemType} ${item.title || "Untitled"}`);

    copy.append(title, meta);
    actions.append(editButton, deleteButton);
    row.append(copy, actions);

    return row;
}

function createEmptyMessage(message) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "admin-list-empty";
    emptyMessage.textContent = message;
    return emptyMessage;
}

async function renderWorksAdmin() {
    const works = await adminStore.getWorks();
    const fragment = document.createDocumentFragment();

    works.forEach((work) => {
        fragment.appendChild(
            createAdminItem(work, `ID: ${work.id} · Slug: ${work.slug || "none"} · Order: ${work.order ?? "none"}`, "Work")
        );
    });

    workList.replaceChildren(works.length > 0 ? fragment : createEmptyMessage("No Works saved."));
    workCount.textContent = String(works.length);

    const optionFragment = document.createDocumentFragment();
    works.forEach((work) => {
        const option = document.createElement("option");
        option.value = work.id;
        option.label = work.title || work.id;
        optionFragment.appendChild(option);
    });
    workIdOptions.replaceChildren(optionFragment);
}

async function renderGalleryAdmin() {
    const galleryItems = await adminStore.getGalleryItems();
    const fragment = document.createDocumentFragment();

    galleryItems.forEach((item) => {
        fragment.appendChild(
            createAdminItem(
                item,
                `ID: ${item.id} · Category: ${item.category || "none"} · Collection: ${item.collectionId || "none"}`,
                "Gallery item"
            )
        );
    });

    galleryList.replaceChildren(
        galleryItems.length > 0 ? fragment : createEmptyMessage("No Gallery items saved.")
    );
    galleryCount.textContent = String(galleryItems.length);
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
            showAdminStatus("That Work slug is already in use.", true);
            return;
        }

        const savedWork = id
            ? await adminStore.updateWork(id, values)
            : await adminStore.createWork(values);

        if (!savedWork) throw new Error("The Work could not be saved.");

        resetWorkForm();
        await renderAdmin();
        showAdminStatus(id ? "Work updated." : "Work created.");
    } catch (error) {
        showAdminStatus(error.message, true);
    }
});

galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const { id, values } = getFormValues(galleryForm, ["order", "width", "height"]);
        values.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
        const savedItem = id
            ? await adminStore.updateGalleryItem(id, values)
            : await adminStore.createGalleryItem(values);

        if (!savedItem) throw new Error("The Gallery item could not be saved.");

        resetGalleryForm();
        await renderGalleryAdmin();
        showAdminStatus(id ? "Gallery item updated." : "Gallery item created.");
    } catch (error) {
        showAdminStatus(error.message, true);
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
            document.querySelector("#work-form-title").textContent = "Edit Work";
            cancelWorkEdit.hidden = false;
            workForm.scrollIntoView({ behavior: "smooth", block: "start" });
            workForm.elements.title.focus({ preventScroll: true });
            return;
        }

        const warning = cloudMode ? " Photographs in it must be moved or deleted first." : "";
        if (!window.confirm(`Delete the Work "${work.title || work.id}"?${warning}`)) return;

        if (!await adminStore.deleteWork(work.id)) throw new Error("The Work could not be deleted.");
        resetWorkForm();
        await renderAdmin();
        showAdminStatus("Work deleted.");
    } catch (error) {
        showAdminStatus(error.message, true);
    }
});

galleryList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !galleryList.contains(button)) return;

    try {
        const item = await adminStore.getGalleryItemById(button.dataset.id);
        if (!item) return;

        if (button.dataset.action === "edit") {
            fillForm(galleryForm, item);
            document.querySelector("#gallery-form-title").textContent = "Edit Gallery Item";
            cancelGalleryEdit.hidden = false;
            galleryForm.scrollIntoView({ behavior: "smooth", block: "start" });
            galleryForm.elements.title.focus({ preventScroll: true });
            return;
        }

        if (!window.confirm(`Delete the Gallery item "${item.title || item.id}"?`)) return;

        if (!await adminStore.deleteGalleryItem(item.id)) throw new Error("The Gallery item could not be deleted.");
        resetGalleryForm();
        await renderGalleryAdmin();
        showAdminStatus("Gallery item deleted.");
    } catch (error) {
        showAdminStatus(error.message, true);
    }
});

cancelWorkEdit.addEventListener("click", resetWorkForm);
cancelGalleryEdit.addEventListener("click", resetGalleryForm);

resetContentButton.addEventListener("click", async () => {
    if (cloudMode) return;
    const confirmed = window.confirm(
        "Reset all Work and Gallery content? This overwrites every browser-local change with the default seed data."
    );

    if (!confirmed) return;

    if (contentService.resetAllContent()) {
        resetWorkForm();
        resetGalleryForm();
        await renderAdmin();
        showAdminStatus("Default Work and Gallery content restored.");
    } else {
        showAdminStatus("Content could not be reset. Check the browser console for details.", true);
    }
});

function setAdminAccess(allowed) {
    document.querySelector("#works-admin").hidden = !allowed;
    document.querySelector("#gallery-admin").hidden = !allowed;
    resetSection.hidden = cloudMode || !allowed;
    document.querySelectorAll(".admin-nav li").forEach((item, index) => {
        if (index < 2) item.hidden = !allowed;
    });

    if (cloudMode) {
        authSection.hidden = false;
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
            showAdminStatus("Sign in with the enrolled owner account to manage cloud content.");
            return;
        }

        const { data: allowed, error } = await client.rpc("is_portfolio_admin");
        if (generation !== cloudAccessGeneration) return;
        if (error) throw error;
        if (allowed !== true) {
            showAdminStatus("This account is not enrolled as a portfolio admin.", true);
            return;
        }

        setAdminAccess(true);
        await renderAdmin();
        showAdminStatus("Cloud content loaded. Changes here update Supabase.");
    } catch (error) {
        if (generation !== cloudAccessGeneration) return;
        setAdminAccess(false);
        showAdminStatus(`Cloud Admin unavailable: ${error.message}`, true);
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
        showAdminStatus(`Sign in failed: ${error.message}`, true);
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
        showAdminStatus("Signed out of Cloud Admin.");
    } catch (error) {
        showAdminStatus(`Sign out failed: ${error.message}`, true);
    }
});

if (cloudMode) {
    document.querySelector("#admin-mode-label").textContent = "Authenticated cloud editor";
    document.querySelector("#admin-intro-copy").textContent =
        "Cloud changes update Supabase after owner sign-in. Published photo share previews need regeneration and deployment after edits.";
    setAdminAccess(false);
    getSupabaseClient().then((client) => {
        client.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                cloudAccessGeneration++;
                setAdminAccess(false);
            }
        });
        initializeCloudAdmin();
    }).catch((error) => showAdminStatus(`Cloud Admin unavailable: ${error.message}`, true));
} else {
    setAdminAccess(true);
    renderAdmin().catch((error) => showAdminStatus(error.message, true));
}
