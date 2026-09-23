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
        order: row.sort_order,
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

const supabaseRepository = Object.freeze({
    async getCollections() {
        const rows = await querySupabaseTable(
            "collections",
            "id, slug, title, description, cover, cover_srcset, cover_alt, cover_width, cover_height, year, location, category, sort_order, created_at, updated_at"
        );

        return rows.map(mapSupabaseCollection);
    },

    async getPhotos() {
        const rows = await querySupabaseTable(
            "photos",
            "id, collection_id, title, alt, src, full_src, srcset, category, location, shot_at, sort_order, width, height, created_at, updated_at"
        );

        return rows.map(mapSupabasePhoto);
    }
});
