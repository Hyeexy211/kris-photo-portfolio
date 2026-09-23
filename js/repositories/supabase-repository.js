// ================================================================
// Lesson 34: Supabase content repository
// Only this file sends database queries. UI files and Content Service never call .from().
// ================================================================

function mapSupabaseCollection(row) {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description || "",
        story: row.story || "",
        cover: row.cover,
        coverSrcset: row.cover_srcset || "",
        coverAlt: row.cover_alt || `${row.title} collection cover`,
        coverWidth: row.cover_width,
        coverHeight: row.cover_height,
        year: row.year || "",
        location: row.location || "",
        category: row.category || row.slug,
        order: row.sort_order,
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || ""
    };
}

function mapSupabasePhoto(row) {
    return {
        id: row.id,
        collectionId: row.collection_id,
        title: row.title || row.alt || "",
        alt: row.alt || row.title || "Photography work",
        src: row.src,
        fullSrc: row.full_src || row.src,
        srcset: row.srcset || "",
        category: row.category || "",
        location: row.location || "",
        date: row.shot_at || "",
        captureTime: row.capture_time || "",
        description: row.description || "",
        tags: Array.isArray(row.tags) ? row.tags : [],
        camera: row.camera || "",
        lens: row.lens || "",
        focalLength: row.focal_length || "",
        aperture: row.aperture || "",
        shutterSpeed: row.shutter_speed || "",
        iso: row.iso || "",
        order: row.sort_order,
        collectionOrder: row.collection_id
            ? Number.isFinite(row.collection_order)
                ? row.collection_order : Number.isFinite(row.sort_order) ? row.sort_order : null
            : null,
        width: row.width,
        height: row.height,
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || ""
    };
}

async function querySupabaseTable(tableName, columns) {
    const client = await getSupabaseClient();
    const { data, error } = await client
        .from(tableName)
        .select(columns)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(`Supabase could not read ${tableName}: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
}

function toSupabaseCollection(collection) {
    return {
        id: collection.id,
        slug: collection.slug,
        title: collection.title,
        description: collection.description || "",
        story: collection.story || "",
        cover: collection.cover,
        cover_srcset: collection.coverSrcset || "",
        cover_alt: collection.coverAlt || "",
        cover_width: collection.coverWidth || null,
        cover_height: collection.coverHeight || null,
        year: collection.year || "",
        location: collection.location || "",
        category: collection.category || "",
        sort_order: Number.isFinite(collection.order) ? collection.order : 0
    };
}

function toSupabasePhoto(photo) {
    const row = {
        id: photo.id,
        collection_id: photo.collectionId || null,
        title: photo.title || "",
        alt: photo.alt || photo.title || "Photography work",
        src: photo.src,
        full_src: photo.fullSrc || photo.src,
        srcset: photo.srcset || "",
        category: photo.category || "",
        location: photo.location || "",
        shot_at: photo.date || null,
        capture_time: photo.captureTime || null,
        collection_order: photo.collectionId && Number.isFinite(photo.collectionOrder)
            ? photo.collectionOrder : null,
        description: photo.description || "",
        tags: Array.isArray(photo.tags) ? photo.tags : [],
        camera: photo.camera || "",
        lens: photo.lens || "",
        focal_length: photo.focalLength || "",
        aperture: photo.aperture || "",
        shutter_speed: photo.shutterSpeed || "",
        iso: photo.iso || "",
        width: photo.width || null,
        height: photo.height || null
    };

    if (Number.isFinite(photo.order)) row.sort_order = photo.order;
    return row;
}

function onlyProvidedColumns(input, mapped, fieldColumns) {
    const values = {};

    Object.entries(fieldColumns).forEach(([field, column]) => {
        if (Object.prototype.hasOwnProperty.call(input, field)
            && Object.prototype.hasOwnProperty.call(mapped, column)) {
            values[column] = mapped[column];
        }
    });

    return values;
}

async function writeSupabaseRow(tableName, operation, values, id) {
    const client = await getSupabaseClient();
    let query;

    if (operation === "insert") query = client.from(tableName).insert(values).select().single();
    if (operation === "update") query = client.from(tableName).update(values).eq("id", id).select().single();
    if (operation === "delete") query = client.from(tableName).delete().eq("id", id).select("id").single();

    const { data, error } = await query;
    if (error) {
        const newColumn = ["story", "collection_order", "capture_time"]
            .find((column) => error.message?.includes(column));
        if (newColumn && ["PGRST204", "42703"].includes(error.code)) {
            throw new Error(`Supabase ${operation} on ${tableName} needs migration supabase/migrations/20260923_collection_content.sql (${newColumn} column is missing), or a PostgREST schema cache refresh if that migration is already applied. ${error.message}`);
        }
        if (tableName === "collections" && operation === "delete" && error.code === "23503") {
            throw new Error(`Collection deletion needs migration supabase/migrations/20260923_collection_content.sql so linked photos can be detached. ${error.message}`);
        }
        throw new Error(`Supabase ${operation} on ${tableName} failed: ${error.message}`);
    }
    return data;
}

const supabaseRepository = Object.freeze({
    async getCollections() {
        // Selecting existing rows without naming optional columns also works before migration.
        const rows = await querySupabaseTable("collections", "*");

        return rows.map(mapSupabaseCollection);
    },

    async getPhotos() {
        const rows = await querySupabaseTable("photos", "*");

        return rows.map(mapSupabasePhoto);
    },

    async photoRowExists(id) {
        const client = await getSupabaseClient();
        const { data, error } = await client.from("photos")
            .select("id")
            .eq("id", id)
            .maybeSingle();
        if (error) throw new Error(`Could not check photo ${id}: ${error.message}`);
        if (data !== null && data?.id !== id) {
            throw new Error(`Photo ${id} returned an unexpected lookup result.`);
        }
        return data !== null;
    },

    async imageRowUsesUrl(tableName, id, url) {
        const imageColumn = tableName === "collections" ? "cover"
            : tableName === "photos" ? "src" : null;
        if (!imageColumn) throw new Error("Unsupported image table.");
        const client = await getSupabaseClient();
        const { data, error } = await client.from(tableName)
            .select(`id, ${imageColumn}`)
            .eq("id", id)
            .maybeSingle();
        if (error) throw new Error(`Could not check ${tableName} image: ${error.message}`);
        return data?.[imageColumn] === url;
    },

    async createCollection(collection) {
        return mapSupabaseCollection(await writeSupabaseRow("collections", "insert", toSupabaseCollection(collection)));
    },
    async updateCollection(id, collection) {
        const values = onlyProvidedColumns(collection, toSupabaseCollection(collection), {
            slug: "slug", title: "title", description: "description", story: "story",
            cover: "cover", coverSrcset: "cover_srcset", coverAlt: "cover_alt",
            coverWidth: "cover_width", coverHeight: "cover_height", year: "year",
            location: "location", category: "category", order: "sort_order"
        });
        values.updated_at = new Date().toISOString();
        return mapSupabaseCollection(await writeSupabaseRow("collections", "update", values, id));
    },
    async deleteCollection(id) {
        await writeSupabaseRow("collections", "delete", null, id);
        return true;
    },
    async createPhoto(photo) {
        return mapSupabasePhoto(await writeSupabaseRow("photos", "insert", toSupabasePhoto(photo)));
    },
    async updatePhoto(id, photo) {
        const values = onlyProvidedColumns(photo, toSupabasePhoto(photo), {
            collectionId: "collection_id", collectionOrder: "collection_order",
            title: "title", alt: "alt", src: "src", fullSrc: "full_src",
            srcset: "srcset", category: "category", location: "location",
            date: "shot_at", captureTime: "capture_time", description: "description",
            tags: "tags", camera: "camera", lens: "lens",
            focalLength: "focal_length", aperture: "aperture",
            shutterSpeed: "shutter_speed", iso: "iso", width: "width",
            height: "height", order: "sort_order"
        });
        if (Object.prototype.hasOwnProperty.call(photo, "collectionOrder")) {
            values.collection_order = Number.isFinite(photo.collectionOrder)
                ? photo.collectionOrder : null;
        }
        if (Object.prototype.hasOwnProperty.call(photo, "collectionId")
            && !Object.prototype.hasOwnProperty.call(photo, "collectionOrder")) {
            // A previous Collection's position must not become the new one's position.
            values.collection_order = null;
        }
        if (Object.prototype.hasOwnProperty.call(photo, "collectionId") && !photo.collectionId) {
            values.collection_order = null;
        }
        values.updated_at = new Date().toISOString();
        return mapSupabasePhoto(await writeSupabaseRow("photos", "update", values, id));
    },
    async deletePhoto(id) {
        await writeSupabaseRow("photos", "delete", null, id);
        return true;
    }
});
