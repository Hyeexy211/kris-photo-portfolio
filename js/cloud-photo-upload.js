// Cloud Admin renders small public WebP files from a selected local photograph.
// The selected source file is never sent to Storage.
const CLOUD_WEB_BUCKET = "portfolio-web";
const CLOUD_WEB_WIDTHS = [640, 1200, 1800];
const CLOUD_WEB_MAX_FILE_BYTES = 6 * 1024 * 1024;

function canvasToWebp(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob || blob.type !== "image/webp") {
                reject(new Error("This browser could not encode WebP. Use a browser with WebP export support."));
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
        throw new Error("The browser produced an invalid WebP file.");
    }

    let offset = 12;
    while (offset + 8 <= bytes.length) {
        const type = chunkName(offset);
        const length = view.getUint32(offset + 4, true);
        if (type === "EXIF" || type === "XMP ") {
            throw new Error("The WebP export contains EXIF or XMP metadata and was not uploaded.");
        }
        offset += 8 + length + (length % 2);
        if (offset > bytes.length) throw new Error("The browser produced a malformed WebP file.");
    }
    if (offset !== bytes.length) throw new Error("The browser produced a malformed WebP file.");
}

async function prepareCloudWebExports(file) {
    if (!file || !["image/jpeg", "image/webp", "image/avif"].includes(file.type)) {
        throw new Error("Choose a JPEG, WebP, or AVIF photograph.");
    }
    if (file.size > 25 * 1024 * 1024) {
        throw new Error("The selected file exceeds the 25 MiB browser processing limit.");
    }

    let image;
    try {
        image = await createImageBitmap(file);
    } catch {
        throw new Error("The browser could not open this photograph. Check its format and file integrity.");
    }

    try {
        if (image.width < 1800 || image.height < 1 || image.width * image.height > 40000000) {
            throw new Error("Choose a photograph at least 1800 pixels wide and no more than 40 megapixels.");
        }

        const exports = [];
        for (const width of CLOUD_WEB_WIDTHS) {
            const height = Math.round(image.height * width / image.width);
            if (height > 8192) {
                throw new Error("This photograph is too tall for browser export.");
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d", { colorSpace: "srgb" });
            if (!context) throw new Error("The browser could not prepare an image canvas.");
            context.drawImage(image, 0, 0, width, height);
            const blob = await canvasToWebp(canvas);
            canvas.width = 0;
            canvas.height = 0;

            if (blob.size > CLOUD_WEB_MAX_FILE_BYTES) {
                throw new Error(`${width}px WebP exceeds 6 MiB. Choose a smaller source image.`);
            }
            await assertNoExifOrXmp(blob);
            exports.push({ width, height, blob });
        }
        return exports;
    } finally {
        image.close();
    }
}

function getVerifiedCloudPublicUrl(storage, path) {
    const { data } = storage.getPublicUrl(path);
    const actual = new URL(data?.publicUrl || "");
    const expected = new URL(`/storage/v1/object/public/${CLOUD_WEB_BUCKET}/${path}`,
        CONTENT_DATA_SOURCE.supabase.url);
    if (actual.href !== expected.href) {
        throw new Error("Storage returned an unexpected public image URL.");
    }
    return actual.href;
}

async function uploadCloudWebExports(photoId, exports, onUploaded) {
    const revision = createContentId("revision");
    if (!/^[a-z0-9-]+$/.test(photoId) || !/^[a-z0-9-]+$/.test(revision)) {
        throw new Error("A safe photo ID could not be generated.");
    }

    const client = await getSupabaseClient();
    const storage = client.storage.from(CLOUD_WEB_BUCKET);
    const prefix = `photos/${photoId}/${revision}`;
    const urls = {};

    for (const item of exports) {
        const path = `${prefix}/${item.width}.webp`;
        const { data, error } = await storage.upload(path, item.blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false
        });
        if (error) {
            throw new Error(`Upload of ${item.width}px WebP failed at ${path}: ${error.message}`);
        }
        if (data?.path !== path) {
            throw new Error(`Storage reported an unexpected path after uploading ${path}. Check both the expected and reported paths before retrying: ${data?.path || "none reported"}.`);
        }

        onUploaded(path);
        urls[item.width] = getVerifiedCloudPublicUrl(storage, path);
    }

    const display = exports.find((item) => item.width === 1200);
    return {
        src: urls[1200],
        fullSrc: urls[1800],
        srcset: exports.map((item) => `${urls[item.width]} ${item.width}w`).join(", "),
        width: display.width,
        height: display.height
    };
}

async function removeCloudWebExports(paths) {
    if (paths.length === 0) return;
    const client = await getSupabaseClient();
    const { data, error } = await client.storage.from(CLOUD_WEB_BUCKET).remove(paths);
    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || data.length !== paths.length) {
        throw new Error("Storage did not confirm removal of every uploaded web file.");
    }
}
