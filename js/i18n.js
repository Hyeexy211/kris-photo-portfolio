// Site UI translations. Content records keep their original values until localized fields exist.
(function () {
    const fallbackLanguage = "en";
    const preferenceKey = "preferredLanguage";
    const dictionaries = window.siteLocales || {};
    const supportedLanguages = ["zh-CN", "en"];
    const translatedAttributes = {
        "data-i18n": "textContent",
        "data-i18n-aria-label": "aria-label",
        "data-i18n-placeholder": "placeholder",
        "data-i18n-content": "content",
        "data-i18n-title": "title",
        "data-i18n-alt": "alt"
    };
    const listeners = new Set();

    function lookup(dictionary, key) {
        return key.split(".").reduce((value, part) => value?.[part], dictionary);
    }

    function browserLanguage() {
        try {
            const language = navigator.language || navigator.languages?.[0] || "";
            return /^zh(?:-|$)/i.test(language) ? "zh-CN" : "en";
        } catch {
            return fallbackLanguage;
        }
    }

    function savedLanguage() {
        try {
            const saved = window.localStorage.getItem(preferenceKey);
            return supportedLanguages.includes(saved) ? saved : null;
        } catch {
            return null;
        }
    }

    let currentLanguage = savedLanguage() || browserLanguage();

    function t(key, values = {}) {
        const template = lookup(dictionaries[currentLanguage], key)
            ?? lookup(dictionaries[fallbackLanguage], key);
        if (typeof template !== "string") return key;
        return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
        ));
    }

    // Future CMS fields may be title_zh/title_en or translations[locale].title.
    function content(record, field) {
        if (!record) return "";
        const suffix = currentLanguage === "zh-CN" ? "zh" : "en";
        return record.translations?.[currentLanguage]?.[field]
            || record[`${field}_${suffix}`]
            || record[field]
            || "";
    }

    function category(value) {
        const key = String(value || "").trim().toLowerCase();
        if (!["street", "portrait", "documentary", "landscape"].includes(key)) return value || "";
        return lookup(dictionaries[currentLanguage], `categories.${key}`)
            || lookup(dictionaries[fallbackLanguage], `categories.${key}`)
            || value
            || "";
    }

    function translate(root = document) {
        Object.entries(translatedAttributes).forEach(([dataAttribute, targetAttribute]) => {
            const selector = `[${dataAttribute}]`;
            const elements = [];
            if (root.nodeType === Node.ELEMENT_NODE && root.matches(selector)) elements.push(root);
            elements.push(...root.querySelectorAll(selector));
            elements.forEach((element) => {
                const translated = t(element.getAttribute(dataAttribute));
                if (targetAttribute === "textContent") element.textContent = translated;
                else element.setAttribute(targetAttribute, translated);
            });
        });
    }

    function updateSwitchers() {
        document.querySelectorAll("[data-language]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
        });
    }

    function applyLanguage() {
        document.documentElement.lang = currentLanguage;
        translate();
        updateSwitchers();
    }

    function setLanguage(language) {
        if (!supportedLanguages.includes(language)) return;
        try { window.localStorage.setItem(preferenceKey, language); } catch { /* Storage can be disabled. */ }
        if (language === currentLanguage) return;
        currentLanguage = language;
        applyLanguage();
        listeners.forEach((listener) => listener(language));
    }

    function onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-language]");
        if (button) setLanguage(button.dataset.language);
    });

    window.siteI18n = {
        t,
        content,
        category,
        translate,
        setLanguage,
        getLanguage: () => currentLanguage,
        onChange
    };
    applyLanguage();
})();
