// ================================================================
// Lesson 34: Content data-source configuration
// This static site has no build step, so only browser-safe public values belong here.
// ================================================================

const CONTENT_DATA_SOURCE = Object.freeze({
    // Supabase is now configured; public pages read cloud content first.
    source: "supabase",

    // A cloud failure must not revive stale browser-local photographs.
    fallbackToLocal: false,

    supabase: Object.freeze({
        url: "https://rekmdiatetetndrpyonx.supabase.co",
        publishableKey: "sb_publishable_PjhtjbO7bBBazg2V6B-dUw_jhjZlkEV"
    })
});
