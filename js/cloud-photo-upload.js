// Cloud Admin renders small public WebP files from a selected local photograph.
// The selected source file is never sent to Storage.
const CLOUD_WEB_BUCKET = "portfolio-web";
// Size labels use the longest edge; srcset uses each export's actual width.
const CLOUD_WEB_SIZES = [640, 1200, 1800];
const CLOUD_WEB_MAX_FILE_BYTES = 6 * 1024 * 1024;

function cloudUploadError(key, values = {}) {
    const error = new Error(window.siteI18n.t(key, values));
    error.translationKey = key;
    error.translationValues = values;
    return error;
}

function canvasToWebp(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob || blob.type !== "image/webp") {
                reject(cloudUploadError("admin.upload.webpUnsupported"));
                return;
            }
            resolve(blob);
        }, "image/webp", 0.82);
    });
}

async function assertNoExifOrXmp(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const chunkName = (start) => String.fromCharCode(...bytes.slice(start, start + 4));

    if (bytes.length < 12 || chunkName(0) !== "RIFF" || chunkName(8) !== "WEBP"
        || view.getUint32(4, true) + 8 !== bytes.length) {
        throw cloudUploadError("admin.upload.invalidWebp");
    }

    let offset = 12;
    while (offset + 8 <= bytes.length) {
        const type = chunkName(offset);
        const length = view.getUint32(offset + 4, true);
        if (type === "EXIF" || type === "XMP ") {
            throw cloudUploadError("admin.upload.metadataFound");
        }
        offset += 8 + length + (length % 2);
        if (offset > bytes.length) throw cloudUploadError("admin.upload.malformedWebp");
    }
    if (offset !== bytes.length) throw cloudUploadError("admin.upload.malformedWebp");
}

async function prepareCloudWebExports(file) {
    validateCloudImageFile(file);

    let image;
    try {
        image = await createImageBitmap(file);
    } catch {
        throw cloudUploadError("admin.upload.cannotOpenImage");
    }

    try {
        const longestEdge = Math.max(image.width, image.height);
        if (longestEdge < 1800 || image.width < 1 || image.height < 1
            || image.width * image.height > 40000000) {
            throw cloudUploadError("admin.upload.invalidDimensions");
        }

        const exports = [];
        for (const size of CLOUD_WEB_SIZES) {
            const width = Math.max(1, Math.round(image.width * size / longestEdge));
            const height = Math.max(1, Math.round(image.height * size / longestEdge));

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d", { colorSpace: "srgb" });
            if (!context) throw cloudUploadError("admin.upload.canvasUnavailable");
            context.drawImage(image, 0, 0, width, height);
            const blob = await canvasToWebp(canvas);
            canvas.width = 0;
            canvas.height = 0;

            if (blob.size > CLOUD_WEB_MAX_FILE_BYTES) {
                throw cloudUploadError("admin.upload.exportTooLarge", { size });
            }
            await assertNoExifOrXmp(blob);
            exports.push({ size, width, height, blob });
        }
        return exports;
    } finally {
        image.close();
    }
}

function validateCloudImageFile(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
        throw cloudUploadError("admin.upload.chooseImage");
    }
    if (file.size === 0) {
        throw cloudUploadError("admin.upload.emptyFile");
    }
    if (file.size > 25 * 1024 * 1024) {
        throw cloudUploadError("admin.upload.fileTooLarge");
    }
}

function getVerifiedCloudPublicUrl(storage, path) {
    const { data } = storage.getPublicUrl(path);
    const actual = new URL(data?.publicUrl || "");
    const expected = new URL(`/storage/v1/object/public/${CLOUD_WEB_BUCKET}/${path}`,
        CONTENT_DATA_SOURCE.supabase.url);
    if (actual.href !== expected.href) {
        throw cloudUploadError("admin.upload.unexpectedPublicUrl");
    }
    return actual.href;
}

async function uploadCloudWebExports(kind, contentId, exports, onUploaded) {
    const revision = createContentId("revision");
    if (!["photos", "collections"].includes(kind)
        || !/^[a-z0-9-]+$/.test(contentId) || !/^[a-z0-9-]+$/.test(revision)) {
        throw cloudUploadError("admin.upload.unsafeContentId");
    }

    const client = await getSupabaseClient();
    const storage = client.storage.from(CLOUD_WEB_BUCKET);
    const prefix = `${kind}/${contentId}/${revision}`;
    const urls = {};

    for (const item of exports) {
        const path = `${prefix}/${item.size}.webp`;
        const { data, error } = await storage.upload(path, item.blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false
        });
        if (error) {
            throw cloudUploadError("admin.upload.storageUploadFailed", {
                size: item.size,
                path,
                message: error.message
            });
        }
        onUploaded(path);
        if (data?.path !== path) {
            throw cloudUploadError("admin.upload.unexpectedStoragePath", {
                path,
                reported: data?.path || "—"
            });
        }

        urls[item.size] = getVerifiedCloudPublicUrl(storage, path);
    }

    const display = exports.find((item) => item.size === 1200);
    return {
        src: urls[1200],
        fullSrc: urls[1800],
        srcset: exports.map((item) => `${urls[item.size]} ${item.width}w`).join(", "),
        width: display.width,
        height: display.height
    };
}

async function removeCloudWebExports(paths) {
    if (paths.length === 0) return;
    const client = await getSupabaseClient();
    const { data, error } = await client.storage.from(CLOUD_WEB_BUCKET).remove(paths);
    if (error) throw error;
    if (!Array.isArray(data) || data.length !== paths.length) {
        throw cloudUploadError("admin.upload.removalUnconfirmed");
    }
}
