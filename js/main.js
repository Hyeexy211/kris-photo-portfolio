// ================================================================
// 第 24 课：数据驱动 Gallery 与分类筛选
// photos 已经由 data/photos.js 创建；这里负责把数据转换成页面元素。
// ================================================================

// 首页动态 Gallery 的容器；独立作品页没有这个元素，因此会安全跳过渲染。
const galleryContainer = document.querySelector("#photo-gallery");

// 所有分类按钮使用相同的 click 处理逻辑。
const filterButtons = document.querySelectorAll(".filter-button");

// 根据一条照片数据创建并返回完整的 article 卡片。
function createPhotoCard(photo) {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.dataset.id = photo.id;
    card.dataset.category = photo.category;

    const image = document.createElement("img");
    image.className = "dynamic-photo";
    image.src = photo.src;
    image.alt = photo.title || "Photography work";
    image.loading = "lazy";
    image.decoding = "async";

    // 数据提供响应式图片时继续复用现有 640 / 1200 / 1800 WebP。
    if (photo.srcset) {
        image.srcset = photo.srcset;
        image.sizes = "(max-width: 680px) calc(100vw - 40px), (max-width: 1024px) calc((100vw - 120px) / 2), calc((100vw - 144px) / 3)";
    }

    // 固有尺寸让浏览器在图片下载前预留空间，减少页面跳动。
    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }

    card.appendChild(image);

    // title 和 date 都为空时不创建空白资料区。
    if (photo.title || photo.date) {
        const photoInfo = document.createElement("div");
        photoInfo.className = "photo-info";

        if (photo.title) {
            const title = document.createElement("h3");
            title.className = "photo-title";
            title.textContent = photo.title;
            photoInfo.appendChild(title);
        }

        if (photo.date) {
            const date = document.createElement("p");
            date.className = "photo-date";
            date.textContent = photo.date;
            photoInfo.appendChild(date);
        }

        card.appendChild(photoInfo);
    }

    return card;
}

// 清空旧内容，再根据传入的数组重新绘制 Gallery。
function renderGallery(photoList) {
    // main.js 也被独立作品页复用；那些页面没有动态 Gallery 容器。
    if (!galleryContainer) return;

    galleryContainer.innerHTML = "";

    if (photoList.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = "No photos found.";
        galleryContainer.appendChild(emptyMessage);
        return;
    }

    photoList.forEach((photo) => {
        const card = createPhotoCard(photo);
        galleryContainer.appendChild(card);
    });
}

// 点击按钮时更新唯一 active 状态，并用 filter() 取得对应分类。
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const category = button.dataset.category;

        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });

        if (category === "all") {
            renderGallery(photos);
            return;
        }

        const filteredPhotos = photos.filter((photo) => {
            return photo.category === category;
        });

        renderGallery(filteredPhotos);
    });
});

// 首次加载默认显示全部照片，对应 HTML 中默认 active 的 All 按钮。
renderGallery(photos);

// ================================================================
// 1. 取得页面元素
// document.querySelector 会取到第一个匹配的元素，querySelectorAll 会取到全部匹配元素。
// ================================================================

// 找到当前页面所有带有 lightbox-trigger 标签的照片按钮。
const lightboxTriggers = document.querySelectorAll(".lightbox-trigger");

// 找到共用的大图灯箱容器。
const lightbox = document.querySelector("#lightbox");

// 找到灯箱中用来显示当前作品的大图元素。
const lightboxImage = document.querySelector("#lightbox-image");

// 找到灯箱右上角的关闭按钮。
const lightboxClose = document.querySelector("#lightbox-close");

// 找到灯箱左右两侧的上一张和下一张按钮。
const lightboxPrev = document.querySelector("#lightbox-prev");
const lightboxNext = document.querySelector("#lightbox-next");

// 找到手机导航的开关按钮。
const menuToggle = document.querySelector("#menu-toggle");

// 找到手机导航的链接列表。
const navLinks = document.querySelector("#nav-links");

// 找到导航列表中的全部站内链接。
const navItems = document.querySelectorAll(".nav-links a");

// 保存打开灯箱之前获得焦点的元素，关闭时把焦点还给它。
let lightboxTrigger = null;

// 记录灯箱当前显示的是 lightboxTriggers 中的第几张照片。
let currentImageIndex = 0;

// ================================================================
// 2. 共用的覆盖层状态
// 菜单和灯箱打开时锁住背景滚动，全部关闭后恢复。
// ================================================================

// 这个函数只负责根据当前状态更新 body 的滚动锁。
function updatePageScroll() {
    // classList.contains 返回 true 表示对应覆盖层目前处于打开状态。
    const hasOpenOverlay = (lightbox?.classList.contains("active") ?? false) || navLinks.classList.contains("active");

    // toggle 的第二个参数是布尔值：true 添加 class，false 移除 class。
    document.body.classList.toggle("has-overlay", hasOpenOverlay);
}

// ================================================================
// 3. 图片灯箱
// 点击作品时打开；按钮、方向键或键盘负责切换与关闭。
// ================================================================

// 根据索引找出照片，并把它的地址和替代文字放进灯箱。
function showLightboxImage(index) {
    // 没有可查看的照片时立即结束，避免访问不存在的数组成员。
    if (lightboxTriggers.length === 0) return;

    // 取余运算让最后一张的下一张回到开头，第一张的上一张回到末尾。
    currentImageIndex = (index + lightboxTriggers.length) % lightboxTriggers.length;

    // 取得当前位置对应的照片按钮和其中的图片。
    const trigger = lightboxTriggers[currentImageIndex];
    const image = trigger.querySelector("img");

    // 使用作品按钮指定的大图；没有指定时才回退到当前响应式图片。
    lightboxImage.src = trigger.dataset.fullSrc || image.currentSrc || image.src;

    // 把原图的替代文字同步给灯箱大图。
    lightboxImage.alt = image.alt;
}

// 函数参数 trigger 是被点击的作品按钮，index 是它在照片列表中的位置。
function openLightbox(trigger, index) {
    // 按照被点击照片的索引更新灯箱内容和当前状态。
    showLightboxImage(index);

    // 记录触发按钮，稍后关闭灯箱时恢复键盘焦点。
    lightboxTrigger = trigger;

    // active 与 CSS 的 .lightbox.active 对应，负责显示灯箱。
    lightbox.classList.add("active");

    // 同步辅助技术状态，说明对话框此时不再隐藏。
    lightbox.setAttribute("aria-hidden", "false");

    // 灯箱打开后禁止背景页面滚动。
    updatePageScroll();

    // 等浏览器完成当前次绘制后再移动焦点，确保灯箱已进入可见状态。
    window.requestAnimationFrame(() => {
        // 若灯箱在下一帧到来前已关闭，不把焦点移回隐藏的按钮。
        if (!lightbox.classList.contains("active")) return;

        // 把键盘焦点移到关闭按钮，方便键盘和屏幕阅读器用户立即操作。
        lightboxClose.focus();
    });
}

// 关闭灯箱时不改变被查看的原图文件，只恢复页面交互状态。
function closeLightbox() {
    // 如果灯箱已经关闭，就不重复操作。
    if (!lightbox.classList.contains("active")) return;

    // 移除 active，CSS 会播放淡出动画。
    lightbox.classList.remove("active");

    // 如果触发按钮仍存在于页面，就把焦点还给它。
    if (lightboxTrigger && lightboxTrigger.isConnected) lightboxTrigger.focus();

    // 焦点移出后再隐藏对话框，避免把 aria-hidden 设置在仍含焦点的元素上。
    lightbox.setAttribute("aria-hidden", "true");

    // 根据是否还有其他覆盖层决定是否恢复背景滚动。
    updatePageScroll();

    // 清空这次灯箱操作保存的按钮引用。
    lightboxTrigger = null;
}

// 对项目页中的每张 lightbox-trigger 照片绑定同一种点击行为。
lightboxTriggers.forEach((trigger, index) => {
    // button 原生支持鼠标点击，以及键盘 Enter 和 Space 激活。
    trigger.addEventListener("click", () => openLightbox(trigger, index));
});

// 点击上一张时显示当前索引前一项；showLightboxImage 会处理首尾循环。
lightboxPrev?.addEventListener("click", () => showLightboxImage(currentImageIndex - 1));

// 点击下一张时显示当前索引后一项；showLightboxImage 会处理首尾循环。
lightboxNext?.addEventListener("click", () => showLightboxImage(currentImageIndex + 1));

// 关闭按钮被点击时调用同一个关闭函数。
lightboxClose?.addEventListener("click", closeLightbox);

// 点击灯箱空白遮罩时关闭；点击中间图片时不会关闭。
lightbox?.addEventListener("click", (event) => {
    // event.target 是用户实际点击到的元素。
    if (event.target === lightbox) closeLightbox();
});

// ================================================================
// 4. 移动端导航
// 所有打开和关闭操作都集中到 setMenuOpen，避免状态不同步。
// ================================================================

// open 是布尔值：true 表示打开菜单，false 表示关闭菜单。
function setMenuOpen(open) {
    // 用 active class 控制全屏导航的显示与隐藏。
    navLinks.classList.toggle("active", open);

    // aria-expanded 让辅助技术知道按钮控制的菜单当前是否展开。
    menuToggle.setAttribute("aria-expanded", String(open));

    // aria-label 随状态切换，使图标按钮始终有准确的读屏名称。
    menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");

    // 打开时显示 ×，关闭时显示 ☰。
    menuToggle.textContent = open ? "×" : "☰";

    // 菜单打开时锁住页面滚动，关闭时再检查其他覆盖层状态。
    updatePageScroll();
}

// 点击菜单按钮时反转当前状态。
menuToggle.addEventListener("click", () => {
    // 先读取菜单现在是否已打开。
    const isOpen = navLinks.classList.contains("active");

    // 传入相反的布尔值，实现打开与关闭切换。
    setMenuOpen(!isOpen);
});

// 点击任意导航链接后关闭全屏菜单，锚点链接照常滚动到对应区块。
navItems.forEach((item) => {
    // 每个链接都使用同一个关闭逻辑。
    item.addEventListener("click", () => setMenuOpen(false));
});

// 当窗口从手机宽度变为桌面宽度时，清理可能残留的手机菜单状态。
window.addEventListener("resize", () => {
    // 桌面导航不需要全屏菜单，避免滚动锁继续留在 body 上。
    if (window.innerWidth > 768 && navLinks.classList.contains("active")) setMenuOpen(false);
});

// ================================================================
// 5. 键盘操作
// Escape 关闭当前覆盖层；方向键切换照片；Tab 维持模态焦点。
// ================================================================

// 在 document 上监听按键，无论当前焦点在哪个元素都能响应 Escape。
document.addEventListener("keydown", (event) => {
    // 灯箱打开时优先处理灯箱，不影响其他普通按键。
    if (lightbox?.classList.contains("active")) {
        // Escape 是常见的关闭对话框快捷键。
        if (event.key === "Escape") {
            // 关闭灯箱并恢复到原作品按钮的焦点。
            closeLightbox();

            // 处理完成后不继续进入下面的菜单逻辑。
            return;
        }

        // 右方向键显示下一张照片，并阻止页面发生默认滚动。
        if (event.key === "ArrowRight") {
            event.preventDefault();
            showLightboxImage(currentImageIndex + 1);
            return;
        }

        // 左方向键显示上一张照片，并阻止页面发生默认滚动。
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showLightboxImage(currentImageIndex - 1);
            return;
        }

        // 灯箱内的全部可聚焦按钮组成一个循环列表。
        if (event.key === "Tab") {
            const lightboxFocusItems = [lightboxClose, lightboxPrev, lightboxNext].filter(Boolean);
            const firstItem = lightboxFocusItems[0];
            const lastItem = lightboxFocusItems[lightboxFocusItems.length - 1];

            // Shift+Tab 从第一个按钮向前时，跳到最后一个按钮。
            if (event.shiftKey && document.activeElement === firstItem) {
                event.preventDefault();
                lastItem.focus();
            }

            // 普通 Tab 从最后一个按钮向后时，回到第一个按钮。
            if (!event.shiftKey && document.activeElement === lastItem) {
                event.preventDefault();
                firstItem.focus();
            }
        }

        // 灯箱打开时不再处理菜单快捷键。
        return;
    }

    // 菜单打开时按 Escape 可以关闭菜单。
    if (event.key === "Escape" && navLinks.classList.contains("active")) {
        // 恢复菜单关闭状态和页面滚动。
        setMenuOpen(false);

        // 将焦点还给原来的菜单按钮。
        menuToggle.focus();
    }

    // 全屏菜单打开时，让 Tab 在菜单按钮与链接之间循环，不进入背后内容。
    if (event.key === "Tab" && navLinks.classList.contains("active")) {
        // 第一项是菜单按钮，之后按页面顺序排列全部导航链接。
        const menuFocusItems = [menuToggle, ...navItems];

        // 保存循环列表中的第一个元素。
        const firstItem = menuFocusItems[0];

        // 保存循环列表中的最后一个元素。
        const lastItem = menuFocusItems[menuFocusItems.length - 1];

        // Shift+Tab 从第一个元素往前时，跳到最后一个元素。
        if (event.shiftKey && document.activeElement === firstItem) {
            // 阻止浏览器把焦点移到菜单外。
            event.preventDefault();

            // 手动聚焦最后一个导航链接。
            lastItem.focus();
        }

        // 普通 Tab 从最后一个链接往后时，回到菜单按钮。
        if (!event.shiftKey && document.activeElement === lastItem) {
            // 阻止浏览器把焦点移到菜单外。
            event.preventDefault();

            // 手动聚焦菜单按钮。
            firstItem.focus();
        }
    }
});

// ================================================================
// 6. 滚动显现动画
// 只有浏览器支持 IntersectionObserver 且用户没有要求减少动画时才启用。
// ================================================================

// 选取所有标题和作品卡片上标有 reveal class 的元素。
const revealElements = document.querySelectorAll(".reveal");

// 查询系统是否要求减少动画，保护容易晕动的访问者。
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 不支持观察器时不添加 .js，CSS 会让所有作品保持可见，避免内容消失。
if ("IntersectionObserver" in window && !prefersReducedMotion) {
    // 创建观察器，浏览器会在元素进入或离开视口时调用回调函数。
    const revealObserver = new IntersectionObserver(
        // entries 是这次发生可见性变化的元素列表。
        (entries) => {
            // 逐个检查可见性变化。
            entries.forEach((entry) => {
                // isIntersecting 为 true 表示元素已经进入视口。
                if (entry.isIntersecting) {
                    // 添加 active，使 CSS 从透明位移状态过渡到正常状态。
                    entry.target.classList.add("active");

                    // 动画只播放一次，显示后不再观察这个元素。
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        // threshold 决定元素露出多少比例时触发。
        { threshold: 0.15 }
    );

    // 只有观察器创建成功后才启用 CSS 的隐藏起点。
    document.documentElement.classList.add("js");

    // 开始观察每个需要淡入的元素。
    revealElements.forEach((element) => revealObserver.observe(element));
}
