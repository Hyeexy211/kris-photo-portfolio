const galleryImages = document.querySelectorAll(".gallery-item img");

const lightbox = document.querySelector("#lightbox");

const lightboxImage = document.querySelector("#lightbox-image");

const lightboxClose = document.querySelector("#lightbox-close");


galleryImages.forEach((image) => {

    image.addEventListener("click", () => {

        lightbox.classList.add("active");

        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;

    });

});

lightboxClose.addEventListener("click", () => {

    lightbox.classList.remove("active");

});

lightbox.addEventListener("click", (event) => {

    if (event.target === lightbox) {

        lightbox.classList.remove("active");

    }

});

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        lightbox.classList.remove("active");

    }

});