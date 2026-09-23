// ================================================================
// Lesson 34: Content data-source configuration
// This static site has no build step, so only browser-safe public values belong here.
// ================================================================

const CONTENT_DATA_SOURCE = Object.freeze({
    // Keep "local" until the Supabase tables, RLS policies and public key are ready.
    // Change this value to "supabase" to read public content from Supabase.
    source: "local",

    // A failed cloud read falls back to the existing browser-local repository.
    fallbackToLocal: true,

    supabase: Object.freeze({
        url: "https://rekmdiatetetndrpyonx.supabase.co",
        publishableKey: "sb_publishable_PjhtjbO7bBBazg2V6B-dUw_jhjZlkEV"
    })
});
