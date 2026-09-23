// ================================================================
// Browser-local Admin prototype
// 表单只调用 Content Service；这里不直接读写 localStorage。
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
        field.value = item[field.name] ?? "";
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

function renderWorksAdmin() {
    const works = contentService.getWorks();
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

function renderGalleryAdmin() {
    const galleryItems = contentService.getGalleryItems();
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

function renderAdmin() {
    renderWorksAdmin();
    renderGalleryAdmin();
}

workForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const { id, values } = getFormValues(workForm, ["order", "coverWidth", "coverHeight"]);
    const duplicateSlug = contentService
        .getWorks()
        .some((work) => work.slug === values.slug && work.id !== id);

    if (duplicateSlug) {
        showAdminStatus("That Work slug is already in use.", true);
        return;
    }

    const savedWork = id
        ? contentService.updateWork(id, values)
        : contentService.createWork(values);

    if (!savedWork) {
        showAdminStatus("The Work could not be saved. Check the browser console for details.", true);
        return;
    }

    resetWorkForm();
    renderAdmin();
    showAdminStatus(id ? "Work updated and saved in this browser." : "Work created and saved in this browser.");
});

galleryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const { id, values } = getFormValues(galleryForm, ["width", "height"]);
    const savedItem = id
        ? contentService.updateGalleryItem(id, values)
        : contentService.createGalleryItem(values);

    if (!savedItem) {
        showAdminStatus("The Gallery item could not be saved. Check the browser console for details.", true);
        return;
    }

    resetGalleryForm();
    renderGalleryAdmin();
    showAdminStatus(id
        ? "Gallery item updated and saved in this browser."
        : "Gallery item created and saved in this browser.");
});

workList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !workList.contains(button)) return;

    const work = contentService.getWorkById(button.dataset.id);
    if (!work) return;

    if (button.dataset.action === "edit") {
        fillForm(workForm, work);
        document.querySelector("#work-form-title").textContent = "Edit Work";
        cancelWorkEdit.hidden = false;
        workForm.scrollIntoView({ behavior: "smooth", block: "start" });
        workForm.elements.title.focus({ preventScroll: true });
        return;
    }

    if (!window.confirm(`Delete the Work "${work.title || work.id}"?`)) return;

    if (contentService.deleteWork(work.id)) {
        resetWorkForm();
        renderAdmin();
        showAdminStatus("Work deleted from this browser.");
    } else {
        showAdminStatus("The Work could not be deleted.", true);
    }
});

galleryList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !galleryList.contains(button)) return;

    const item = contentService.getGalleryItemById(button.dataset.id);
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

    if (contentService.deleteGalleryItem(item.id)) {
        resetGalleryForm();
        renderGalleryAdmin();
        showAdminStatus("Gallery item deleted from this browser.");
    } else {
        showAdminStatus("The Gallery item could not be deleted.", true);
    }
});

cancelWorkEdit.addEventListener("click", resetWorkForm);
cancelGalleryEdit.addEventListener("click", resetGalleryForm);

resetContentButton.addEventListener("click", () => {
    const confirmed = window.confirm(
        "Reset all Work and Gallery content? This overwrites every browser-local change with the default seed data."
    );

    if (!confirmed) return;

    if (contentService.resetAllContent()) {
        resetWorkForm();
        resetGalleryForm();
        renderAdmin();
        showAdminStatus("Default Work and Gallery content restored.");
    } else {
        showAdminStatus("Content could not be reset. Check the browser console for details.", true);
    }
});

renderAdmin();
