const dashboardStatus = document.querySelector("#dashboard-status");
const dashboardAuth = document.querySelector("#dashboard-auth");
const dashboardLoginForm = document.querySelector("#dashboard-login-form");
const dashboardLinks = document.querySelector("#dashboard-links");
const dashboardI18n = window.siteI18n;
let dashboardAccessGeneration = 0;
let dashboardStatusState = null;
const heroSection = document.querySelector("#dashboard-hero");
const aboutSection = document.querySelector("#dashboard-about");
const heroForm = document.querySelector("#dashboard-hero-form");
const heroFile = document.querySelector("#hero-file");
const heroSave = document.querySelector("#hero-save");
const heroCancel = document.querySelector("#hero-cancel");
const heroCurrentImage = document.querySelector("#hero-current-image");
const heroCurrentCaption = document.querySelector("#hero-current-caption");
const heroNewPreview = document.querySelector("#hero-new-preview");
const heroNewImage = document.querySelector("#hero-new-image");
const heroStatus = document.querySelector("#hero-status");
const aboutForm = document.querySelector("#dashboard-about-form");
const aboutHeading = document.querySelector("#about-heading-input");
const aboutBody = document.querySelector("#about-body-input");
const aboutSave = document.querySelector("#about-save");
const aboutCancel = document.querySelector("#about-cancel");
const aboutStatus = document.querySelector("#about-status");
let dashboardSettings = null;
let dashboardAllowed = false;
let selectedHeroFile = null;
let heroPreviewUrl = null;
let heroSelectionGeneration = 0;
let heroSaving = false;
let aboutSaving = false;
const aboutDrafts = { en: null, "zh-CN": null };

heroCurrentImage.addEventListener("error", () => {
    heroCurrentImage.hidden = true;
    heroCurrentCaption.textContent = dashboardI18n.t("dashboard.hero.previewFailed");
});

function createContentId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showSiteSection() {
    heroSection.hidden = !dashboardAllowed || location.hash !== "#dashboard-hero";
    aboutSection.hidden = !dashboardAllowed || location.hash !== "#dashboard-about";
    if (dashboardAllowed && (location.hash === "#dashboard-hero" || location.hash === "#dashboard-about")) {
        requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
    }
}

function showFieldStatus(element, key, values = {}, isError = false) {
    element.dataset.statusKey = key;
    element.dataset.statusValues = JSON.stringify(values);
    element.textContent = dashboardI18n.t(key, values);
    element.classList.toggle("is-error", isError);
}

function restoreHeroSelection() {
    heroSelectionGeneration++;
    selectedHeroFile = null;
    heroFile.value = "";
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    heroPreviewUrl = null;
    heroNewImage.removeAttribute("src");
    heroNewPreview.hidden = true;
}

function renderCurrentHero() {
    const src = dashboardSettings?.hero_src;
    heroCurrentImage.hidden = !src;
    if (src) heroCurrentImage.src = src;
    else heroCurrentImage.removeAttribute("src");
    heroCurrentCaption.textContent = dashboardI18n.t(src
        ? "dashboard.hero.current" : "dashboard.hero.noImage");
}

function savedAbout(language) {
    const suffix = language === "zh-CN" ? "zh" : "en";
    const defaults = window.siteLocales?.[language]?.home || {};
    return {
        title: dashboardSettings?.[`about_title_${suffix}`] || defaults.aboutTitle || "",
        description: dashboardSettings?.[`about_description_${suffix}`] || defaults.aboutDescription || ""
    };
}

function renderAboutForm() {
    const language = dashboardI18n.getLanguage();
    const values = aboutDrafts[language] || savedAbout(language);
    aboutHeading.value = values.title;
    aboutBody.value = values.description;
}

async function loadDashboardSettings(generation) {
    showFieldStatus(heroStatus, "dashboard.status.loading");
    showFieldStatus(aboutStatus, "dashboard.status.loading");
    try {
        const settings = await supabaseRepository.getSiteSettings();
        if (generation !== dashboardAccessGeneration || !dashboardAllowed) return;
        dashboardSettings = settings;
        if (!dashboardSettings) throw new Error("Site settings row is missing. Apply the site content migration.");
        heroFile.disabled = heroSave.disabled = aboutSave.disabled = false;
        renderCurrentHero();
        renderAboutForm();
        showFieldStatus(heroStatus, "dashboard.status.ready");
        showFieldStatus(aboutStatus, "dashboard.status.ready");
    } catch (error) {
        showFieldStatus(heroStatus, "dashboard.status.loadFailed", { message: error.message }, true);
        showFieldStatus(aboutStatus, "dashboard.status.loadFailed", { message: error.message }, true);
    }
}

function renderDashboardStatus() {
    if (!dashboardStatusState) return;
    dashboardStatus.textContent = dashboardI18n.t(dashboardStatusState.key, dashboardStatusState.values);
}

function showDashboardAccess(allowed, key, values = {}) {
    dashboardAllowed = allowed;
    if (!allowed) {
        dashboardSettings = null;
        heroFile.disabled = heroSave.disabled = aboutSave.disabled = true;
        restoreHeroSelection();
        aboutDrafts.en = aboutDrafts["zh-CN"] = null;
    }
    dashboardAuth.hidden = allowed;
    dashboardLinks.hidden = !allowed;
    showSiteSection();
    dashboardStatusState = { key, values };
    renderDashboardStatus();
}

async function checkDashboardAccess() {
    const generation = ++dashboardAccessGeneration;
    showDashboardAccess(false, "dashboard.status.checking");

    try {
        const client = await getSupabaseClient();
        const { data: userData } = await client.auth.getUser();
        if (generation !== dashboardAccessGeneration) return;

        if (!userData?.user) {
            showDashboardAccess(false, "dashboard.status.signInRequired");
            return;
        }

        const { data: allowed, error } = await client.rpc("is_portfolio_admin");
        if (generation !== dashboardAccessGeneration) return;
        if (error) throw error;
        showDashboardAccess(
            allowed === true,
            allowed === true ? "dashboard.status.confirmed" : "admin.auth.notOwner"
        );
        if (allowed === true) await loadDashboardSettings(generation);
    } catch (error) {
        if (generation !== dashboardAccessGeneration) return;
        showDashboardAccess(false, "dashboard.status.unavailable", { message: error.message });
    }
}

dashboardLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const client = await getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({
            email: dashboardLoginForm.elements.email.value,
            password: dashboardLoginForm.elements.password.value
        });
        dashboardLoginForm.elements.password.value = "";
        if (error) throw error;
        await checkDashboardAccess();
    } catch (error) {
        dashboardLoginForm.elements.password.value = "";
        showDashboardAccess(false, "admin.auth.signInFailed", { message: error.message });
    }
});

window.addEventListener("hashchange", showSiteSection);

heroFile.addEventListener("change", async () => {
    const selection = ++heroSelectionGeneration;
    selectedHeroFile = null;
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    heroPreviewUrl = null;
    heroNewPreview.hidden = true;
    const file = heroFile.files?.[0];
    if (!file) return;
    showFieldStatus(heroStatus, "dashboard.hero.checking");
    try {
        validateCloudImageFile(file);
        const image = await createImageBitmap(file);
        const valid = image.width > 0 && image.height > 0
            && Math.max(image.width, image.height) >= 1800
            && image.width * image.height <= 40000000;
        image.close();
        if (!valid) throw cloudUploadError("admin.upload.invalidDimensions");
        if (selection !== heroSelectionGeneration) return;
        selectedHeroFile = file;
        heroPreviewUrl = URL.createObjectURL(file);
        heroNewImage.src = heroPreviewUrl;
        heroNewPreview.hidden = false;
        showFieldStatus(heroStatus, "dashboard.hero.pending");
    } catch (error) {
        if (selection !== heroSelectionGeneration) return;
        heroFile.value = "";
        showFieldStatus(heroStatus, "dashboard.hero.invalid", { message: error.message }, true);
    }
});

heroCancel.addEventListener("click", () => {
    if (heroSaving) return;
    restoreHeroSelection();
    showFieldStatus(heroStatus, "dashboard.hero.cancelled");
});

heroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!dashboardAllowed || heroSaving || !dashboardSettings) return;
    if (!selectedHeroFile) {
        showFieldStatus(heroStatus, "dashboard.hero.selectFirst", {}, true);
        return;
    }
    heroSaving = true;
    heroSave.disabled = heroCancel.disabled = heroFile.disabled = true;
    let uploaded = null;
    try {
        showFieldStatus(heroStatus, "dashboard.hero.preparing");
        const exports = await prepareCloudWebExports(selectedHeroFile);
        let count = 0;
        showFieldStatus(heroStatus, "dashboard.hero.uploading", { count });
        uploaded = await uploadCloudWebExports("hero", "home", exports, () => {
            count++;
            showFieldStatus(heroStatus, "dashboard.hero.uploading", { count });
        });
        showFieldStatus(heroStatus, "dashboard.hero.saving");
        const saved = await supabaseRepository.updateSiteHero(uploaded);
        if (saved.hero_src !== uploaded.src || saved.hero_srcset !== uploaded.srcset) {
            throw new Error("The saved Hero image did not match the upload.");
        }
        dashboardSettings = saved;
        renderCurrentHero();
        restoreHeroSelection();
        showFieldStatus(heroStatus, "dashboard.hero.saved");
    } catch (error) {
        if (uploaded) {
            try {
                const current = await supabaseRepository.getSiteSettings();
                if (current?.hero_src === uploaded.src && current.hero_srcset === uploaded.srcset) {
                    dashboardSettings = current;
                    renderCurrentHero();
                    restoreHeroSelection();
                    showFieldStatus(heroStatus, "dashboard.hero.saved");
                    return;
                }
            } catch { /* The write result is unknown; keep the files for review. */ }
        }
        showFieldStatus(heroStatus, "dashboard.hero.saveFailed", { message: error.message }, true);
    } finally {
        heroSaving = false;
        heroSave.disabled = heroCancel.disabled = heroFile.disabled = false;
    }
});

function rememberAboutDraft() {
    aboutDrafts[dashboardI18n.getLanguage()] = {
        title: aboutHeading.value,
        description: aboutBody.value
    };
}

aboutHeading.addEventListener("input", rememberAboutDraft);
aboutBody.addEventListener("input", rememberAboutDraft);

aboutCancel.addEventListener("click", () => {
    if (aboutSaving) return;
    aboutDrafts[dashboardI18n.getLanguage()] = null;
    renderAboutForm();
    showFieldStatus(aboutStatus, "dashboard.about.cancelled");
});

aboutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!dashboardAllowed || aboutSaving || !dashboardSettings) return;
    const language = dashboardI18n.getLanguage();
    const title = aboutHeading.value;
    const description = aboutBody.value;
    if (!title.trim() || !description.trim() || title.length > 160 || description.length > 3000) {
        showFieldStatus(aboutStatus, "dashboard.about.invalid", {}, true);
        return;
    }
    aboutSaving = true;
    aboutSave.disabled = aboutCancel.disabled = true;
    showFieldStatus(aboutStatus, "dashboard.about.saving");
    try {
        const saved = await supabaseRepository.updateSiteAbout(language, title, description);
        const suffix = language === "zh-CN" ? "zh" : "en";
        if (saved[`about_title_${suffix}`] !== title
            || saved[`about_description_${suffix}`] !== description) {
            throw new Error("The saved About text did not match the submitted text.");
        }
        dashboardSettings = saved;
        aboutDrafts[language] = null;
        renderAboutForm();
        showFieldStatus(aboutStatus, "dashboard.about.saved");
    } catch (error) {
        try {
            const current = await supabaseRepository.getSiteSettings();
            const suffix = language === "zh-CN" ? "zh" : "en";
            if (current?.[`about_title_${suffix}`] === title
                && current[`about_description_${suffix}`] === description) {
                dashboardSettings = current;
                aboutDrafts[language] = null;
                renderAboutForm();
                showFieldStatus(aboutStatus, "dashboard.about.saved");
                return;
            }
        } catch { /* Keep the unsaved draft if the read also fails. */ }
        showFieldStatus(aboutStatus, "dashboard.about.saveFailed", { message: error.message }, true);
    } finally {
        aboutSaving = false;
        aboutSave.disabled = aboutCancel.disabled = false;
    }
});

getSupabaseClient().then((client) => {
    client.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            dashboardAccessGeneration++;
            showDashboardAccess(false, "dashboard.status.signedOut");
        }
    });
    checkDashboardAccess();
}).catch((error) => showDashboardAccess(false, "dashboard.status.unavailable", { message: error.message }));

dashboardI18n.onChange(() => {
    document.title = dashboardI18n.t("dashboard.seo.title");
    renderDashboardStatus();
    renderCurrentHero();
    renderAboutForm();
    [heroStatus, aboutStatus].forEach((element) => {
        if (element.dataset.statusKey) showFieldStatus(element, element.dataset.statusKey,
            JSON.parse(element.dataset.statusValues || "{}"), element.classList.contains("is-error"));
    });
});
document.title = dashboardI18n.t("dashboard.seo.title");
