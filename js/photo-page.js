const photoTitle = document.querySelector("#photo-title");
const photoCategory = document.querySelector("#photo-category");
const photoDescription = document.querySelector("#photo-description");
const photoContent = document.querySelector("#photo-content");
const photoInfo = document.querySelector("#photo-info");

function createPhotoInfo(labelText, valueText) {
    const item = document.createElement("div");
    const label = document.createElement("p");
    const value = document.createElement("p");
    label.className = "project-info-label";
    label.textContent = labelText;
    value.textContent = valueText;
    item.append(label, value);
    return item;
}

async function renderPhotoPage() {
    const id = new URLSearchParams(window.location.search).get("id");

    try {
        const [photos, collections] = await Promise.all([
            contentService.getPhotos(),
            contentService.getCollections()
        ]);
        const photo = photos.find((item) => item.id === id);

        if (!photo) {
            document.title = "Photograph Not Found | Kris Photography";
            photoTitle.textContent = "Photograph not found";
            photoContent.textContent = "Return to Gallery and choose an available photograph.";
            return;
        }

        const title = photo.title || photo.alt || "Untitled photograph";
        document.title = `${title} | Kris Photography`;
        photoTitle.textContent = title;
        photoCategory.textContent = photo.category || "Photograph";
        photoDescription.textContent = photo.description || "";
        photoDescription.hidden = !photo.description;

        const image = document.createElement("img");
        image.src = photo.fullSrc || photo.src;
        image.alt = photo.alt || title;
        image.decoding = "async";
        if (photo.srcset) {
            image.srcset = photo.srcset;
            image.sizes = "(max-width: 768px) calc(100vw - 40px), calc(100vw - 96px)";
        }
        if (photo.width && photo.height) {
            image.width = photo.width;
            image.height = photo.height;
        }
        const figure = document.createElement("figure");
        figure.className = "project-image";
        figure.appendChild(image);
        photoContent.replaceChildren(figure);

        const details = [createPhotoInfo("Photograph", title)];
        const collection = collections.find((item) => item.id === photo.collectionId);
        if (collection) details.push(createPhotoInfo("Collection", collection.title));
        if (photo.location) details.push(createPhotoInfo("Location", photo.location));
        if (photo.date) details.push(createPhotoInfo("Capture date", photo.date));
        if (photo.camera) details.push(createPhotoInfo("Camera", photo.camera));
        if (photo.lens) details.push(createPhotoInfo("Lens", photo.lens));
        if (photo.focalLength) details.push(createPhotoInfo("Focal length", photo.focalLength));
        if (photo.aperture) details.push(createPhotoInfo("Aperture", photo.aperture));
        if (photo.shutterSpeed) details.push(createPhotoInfo("Shutter speed", photo.shutterSpeed));
        if (photo.iso) details.push(createPhotoInfo("ISO", photo.iso));
        if (Array.isArray(photo.tags) && photo.tags.length) {
            details.push(createPhotoInfo("Tags", photo.tags.join(", ")));
        }
        photoInfo.replaceChildren(...details);

        const canonicalUrl = new URL("photo.html", window.location.href);
        canonicalUrl.search = new URLSearchParams({ id: photo.id }).toString();
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = canonicalUrl.href;
        const description = document.querySelector('meta[name="description"]');
        if (description) description.content = title;
    } catch (error) {
        console.error("Unable to load this photograph.", error);
        document.title = "Photograph Error | Kris Photography";
        photoTitle.textContent = "Photograph unavailable";
        photoContent.textContent = "The photograph could not be loaded. Please try again later.";
    } finally {
        photoContent.removeAttribute("aria-busy");
    }
}

renderPhotoPage();
