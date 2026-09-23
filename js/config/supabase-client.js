// ================================================================
// Lesson 34: Supabase browser client
// This file creates one read-only frontend client from browser-safe configuration.
// ================================================================

const SUPABASE_BROWSER_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0";

let supabaseClientPromise = null;
let supabaseLibraryPromise = null;

function hasSupabaseConfiguration() {
    const { url, publishableKey } = CONTENT_DATA_SOURCE.supabase;

    return typeof url === "string"
        && url.trim() !== ""
        && typeof publishableKey === "string"
        && publishableKey.trim() !== "";
}

function assertBrowserSafeSupabaseKey(key) {
    const normalizedKey = key.trim().toLowerCase();

    if (normalizedKey.startsWith("sb_secret_") || normalizedKey.includes("service_role")) {
        throw new Error("A Supabase Secret Key or service-role key must never be used in browser code.");
    }
}

function loadSupabaseBrowserLibrary() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (supabaseLibraryPromise) return supabaseLibraryPromise;

    supabaseLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SUPABASE_BROWSER_LIBRARY_URL;
        script.async = true;
        script.addEventListener("load", () => {
            if (window.supabase?.createClient) {
                resolve(window.supabase);
                return;
            }

            reject(new Error("The Supabase browser library loaded without exposing createClient()."));
        });
        script.addEventListener("error", () => {
            reject(new Error("The Supabase browser library could not be loaded."));
        });
        document.head.appendChild(script);
    });

    return supabaseLibraryPromise;
}

function getSupabaseClient() {
    if (!hasSupabaseConfiguration()) {
        return Promise.reject(new Error(
            "Supabase is selected but its project URL or publishable key is missing."
        ));
    }

    if (supabaseClientPromise) return supabaseClientPromise;

    const { url, publishableKey } = CONTENT_DATA_SOURCE.supabase;
    assertBrowserSafeSupabaseKey(publishableKey);

    supabaseClientPromise = loadSupabaseBrowserLibrary().then((supabaseLibrary) => (
        supabaseLibrary.createClient(url.trim(), publishableKey.trim(), {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        })
    ));

    return supabaseClientPromise;
}
