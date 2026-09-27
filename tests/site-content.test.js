const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const repositorySource = fs.readFileSync(path.join(root, "js/repositories/supabase-repository.js"), "utf8");
const publicSource = fs.readFileSync(path.join(root, "js/site-content.js"), "utf8");

test("Hero and each About language update only their own columns", async () => {
    const row = {
        id: "home", hero_src: null, hero_srcset: null,
        about_title_en: "English", about_description_en: "English body",
        about_title_zh: "中文", about_description_zh: "中文正文"
    };
    const writes = [];
    const client = {
        from(table) {
            assert.equal(table, "site_settings");
            return {
                select() {
                    return { eq() { return { maybeSingle: async () => ({ data: { ...row }, error: null }) }; } };
                },
                update(values) {
                    writes.push(values);
                    return { eq() { return { select() { return { single: async () => {
                        Object.assign(row, values);
                        return { data: { ...row }, error: null };
                    } }; } }; } };
                }
            };
        }
    };
    const context = vm.createContext({ getSupabaseClient: async () => client, Date, Error });
    vm.runInContext(repositorySource, context);
    const repository = vm.runInContext("supabaseRepository", context);

    await repository.updateSiteHero({ src: "https://example.test/1200.webp", srcset: "https://example.test/640.webp 640w" });
    assert.deepEqual(Object.keys(writes[0]).sort(), ["hero_src", "hero_srcset", "updated_at"]);
    assert.equal(row.about_title_en, "English");
    assert.equal(row.about_title_zh, "中文");

    await repository.updateSiteAbout("zh-CN", "新标题", "第一段\n\n第二段");
    assert.deepEqual(Object.keys(writes[1]).sort(), ["about_description_zh", "about_title_zh", "updated_at"]);
    assert.equal(row.hero_src, "https://example.test/1200.webp");
    assert.equal(row.about_description_en, "English body");
    assert.equal((await repository.getSiteSettings()).about_description_zh, "第一段\n\n第二段");
    await assert.rejects(repository.updateSiteAbout("fr", "x", "y"));
});

test("public About uses plain text, preserves paragraphs, and falls back on read failure", async () => {
    const hero = { hidden: true, addEventListener() {}, removeAttribute() {} };
    const title = { textContent: "" };
    const description = { textContent: "" };
    let language = "en";
    let onLanguageChange;
    let failRead = false;
    const settings = {
        hero_src: "https://example.test/hero.webp",
        hero_srcset: "https://example.test/hero.webp 1200w",
        about_title_en: "Saved heading",
        about_description_en: "One\n\nTwo <script>alert(1)</script>",
        about_title_zh: null,
        about_description_zh: null
    };
    const context = vm.createContext({
        document: { querySelector: (selector) => ({ "#hero-image": hero, "#about-title": title, "#about-description": description })[selector] },
        siteI18n: {
            getLanguage: () => language,
            t: (key) => ({ "home.aboutTitle": "Default title", "home.aboutDescription": "Default body" })[key],
            onChange: (callback) => { onLanguageChange = callback; }
        },
        supabaseRepository: { getSiteSettings: async () => {
            if (failRead) throw new Error("offline");
            return settings;
        } },
        console: { warn() {} }
    });
    vm.runInContext(publicSource, context);
    await vm.runInContext("loadPublicSiteSettings()", context);
    assert.equal(description.textContent, "One\n\nTwo <script>alert(1)</script>");
    assert.equal(hero.src, settings.hero_src);
    assert.equal(hero.hidden, false);

    language = "zh-CN";
    onLanguageChange();
    assert.equal(title.textContent, "Default title");
    assert.equal(description.textContent, "Default body");

    failRead = true;
    language = "en";
    await vm.runInContext("loadPublicSiteSettings()", context);
    assert.equal(description.textContent, "Default body");
    assert.equal(hero.hidden, true);
});
