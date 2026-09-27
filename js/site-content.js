// Public Hero and About read the same settings row as the Dashboard.
const heroImage = document.querySelector("#hero-image");
const aboutTitle = document.querySelector("#about-title");
const aboutDescription = document.querySelector("#about-description");
let publicSiteSettings = null;

if (heroImage) heroImage.addEventListener("error", () => {
    heroImage.hidden = true;
});

function renderPublicSiteSettings() {
    if (!aboutTitle || !aboutDescription) return;
    const language = siteI18n.getLanguage() === "zh-CN" ? "zh" : "en";
    const title = publicSiteSettings?.[`about_title_${language}`];
    const description = publicSiteSettings?.[`about_description_${language}`];
    aboutTitle.textContent = title || siteI18n.t("home.aboutTitle");
    aboutDescription.textContent = description || siteI18n.t("home.aboutDescription");
}

async function loadPublicSiteSettings() {
    try {
        publicSiteSettings = await supabaseRepository.getSiteSettings();
        if (heroImage && publicSiteSettings?.hero_src) {
            heroImage.src = publicSiteSettings.hero_src;
            if (publicSiteSettings.hero_srcset) heroImage.srcset = publicSiteSettings.hero_srcset;
            heroImage.sizes = "100vw";
            heroImage.hidden = false;
        }
    } catch (error) {
        // The static Hero background and translated About copy remain available.
        publicSiteSettings = null;
        if (heroImage) heroImage.hidden = true;
        console.warn("Site settings could not be loaded; showing default content.", error);
    }
    renderPublicSiteSettings();
}

siteI18n.onChange(renderPublicSiteSettings);
loadPublicSiteSettings();
