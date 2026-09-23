// ================================================================
// Lesson 34: Content Service 异步提供首页 Gallery 数据
// 数据、渲染、筛选、动态灯箱入口分别由小函数负责。
// ================================================================

// 首页动态 Gallery 的容器；独立作品页没有这个元素，因此会安全跳过渲染。
const galleryContainer = document.querySelector("#photo-gallery");

// 所有分类按钮使用相同的 click 处理逻辑。
const filterButtons = document.querySelectorAll(".filter-button");

// 当前分类是 Gallery 的唯一筛选状态；初始值与 HTML 的 All 按钮一致。
let activeCategory = "all";

// 保存当前真正显示在 Gallery 中的照片，供灯箱上一张 / 下一张使用。
let renderedPhotos = [];

// Content Service 首次读取后保存在页面内，筛选按钮不重复发送网络请求。
let allGalleryPhotos = [];

// 根据一条照片数据创建与原静态 Gallery 完全相同的可点击按钮。
function createPhotoCard(photo) {
    const card = document.createElement("button");
    card.className = "gallery-item lightbox-trigger reveal";
    card.type = "button";
    card.dataset.id = photo.id;
    card.dataset.category = photo.category;
    card.dataset.fullSrc = photo.fullSrc || photo.src;
    card.setAttribute("aria-label", `Open ${photo.alt || photo.title || "photography work"}`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt || photo.title || "Photography work";
    image.loading = "lazy";
    image.decoding = "async";

    // 数据提供响应式图片时继续复用现有 640 / 1200 / 1800 WebP。
    if (photo.srcset) {
        image.srcset = photo.srcset;
        image.sizes = "(max-width: 768px) calc(100vw - 40px), calc((100vw - 116px) / 2)";
    }

    // 固有尺寸让浏览器在图片下载前预留空间，减少页面跳动。
    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }

    card.appendChild(image);
    return card;
}

// 根据 activeCategory 返回唯一一份应该显示的数据，不在 DOM 中另外保存照片资料。
function getFilteredPhotos() {
    if (activeCategory === "all") return allGalleryPhotos;

    return allGalleryPhotos.filter((photo) => photo.category === activeCategory);
}

// ================================================================
// 第 26 课：根据拍摄日期自动排序照片
// 筛选后的照片会先复制、排序，再交给 Gallery 和灯箱使用。
// ================================================================

// 把严格的 YYYY-MM-DD 转成时间值；缺失或无效日期统一返回 null。
function getPhotoDateValue(photo) {
    if (!photo || typeof photo.date !== "string") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(photo.date)) return null;

    const parsedDate = new Date(`${photo.date}T00:00:00Z`);

    if (Number.isNaN(parsedDate.getTime())) return null;
    if (parsedDate.toISOString().slice(0, 10) !== photo.date) return null;

    return parsedDate.getTime();
}

// 返回一个按日期从新到旧排列的新数组，不改变传入数组的原始顺序。
function sortPhotosByDate(photoList) {
    return [...photoList].sort((photoA, photoB) => {
        const dateA = getPhotoDateValue(photoA);
        const dateB = getPhotoDateValue(photoB);

        // 没有有效日期的照片放在最后，并保留它们原本的相对顺序。
        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateB - dateA;
    });
}

// 用传入数组一次替换 Gallery 内容，避免静态卡片与动态卡片叠加。
function renderGallery(photoList) {
    // main.js 也被独立作品页复用；那些页面没有动态 Gallery 容器。
    if (!galleryContainer) return;

    // 每次渲染都使用排序副本；Content Service 返回的数据不会被 sort() 修改。
    const sortedPhotos = sortPhotosByDate(photoList);

    // 替换 DOM 前停止观察旧卡片，避免筛选多次后留下已经移除的观察目标。
    if (revealObserver) {
        galleryContainer.querySelectorAll(".reveal").forEach((element) => {
            revealObserver.unobserve(element);
        });
    }

    renderedPhotos = sortedPhotos;

    if (sortedPhotos.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = "No photos found.";
        galleryContainer.replaceChildren(emptyMessage);
        return;
    }

    const galleryFragment = document.createDocumentFragment();

    sortedPhotos.forEach((photo) => {
        galleryFragment.appendChild(createPhotoCard(photo));
    });

    galleryContainer.replaceChildren(galleryFragment);

    // render 后把新建的 .reveal 交给同一个 Observer，不重复创建观察器。
    observeRevealElements(galleryContainer);
}

// 分类按钮只绑定一次；每次点击先更新状态，再从 Content Service 查询并渲染。
function setupGalleryFilters() {
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;

            filterButtons.forEach((filterButton) => {
                const isActive = filterButton === button;
                filterButton.classList.toggle("active", isActive);
                filterButton.setAttribute("aria-pressed", String(isActive));
            });

            renderGallery(getFilteredPhotos());
        });
    });
}

// 在持久存在的容器上委托点击，重新渲染后无需给每张卡片重复绑定事件。
function setupGalleryLightbox() {
    galleryContainer.addEventListener("click", (event) => {
        const trigger = event.target.closest(".lightbox-trigger");

        if (!trigger || !galleryContainer.contains(trigger)) return;

        // 直接从当前显示列表取回同一个对象，避免重新读取 localStorage 后对象引用不同，
        // 导致 openLightbox() 无法找到被点击照片的正确索引。
        const photo = renderedPhotos.find((item) => item.id === trigger.dataset.id);

        if (!photo) return;

        openLightbox(photo, trigger, renderedPhotos);
    });
}

// 首页存在 Gallery 时才初始化；独立作品页继续使用自己的静态照片结构。
async function initGallery() {
    if (!galleryContainer) return;

    galleryContainer.setAttribute("aria-busy", "true");
    const loadingMessage = document.createElement("p");
    loadingMessage.className = "gallery-empty";
    loadingMessage.textContent = "Loading photographs…";
    galleryContainer.replaceChildren(loadingMessage);

    try {
        allGalleryPhotos = await contentService.getPhotos();
    } catch (error) {
        console.error("Unable to load Gallery photographs.", error);
        const errorMessage = document.createElement("p");
        errorMessage.className = "gallery-empty";
        errorMessage.textContent = "Unable to load photographs.";
        galleryContainer.replaceChildren(errorMessage);
        return;
    } finally {
        galleryContainer.removeAttribute("aria-busy");
    }

    // 以 HTML 当前的 active 按钮为准，避免初始视觉与 JavaScript 状态不同步。
    const activeButton = [...filterButtons].find((button) => button.classList.contains("active"));
    activeCategory = activeButton?.dataset.category || "all";

    filterButtons.forEach((filterButton) => {
        const isActive = filterButton.dataset.category === activeCategory;
        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });

    setupGalleryFilters();
    setupGalleryLightbox();
    renderGallery(getFilteredPhotos());
}

// ================================================================
// 1. 取得页面元素
// document.querySelector 会取到第一个匹配的元素，querySelectorAll 会取到全部匹配元素。
// ================================================================

// 独立作品页的静态照片按钮仍保留；首页动态 Gallery 会使用事件委托。
let lightboxTriggers = [];

// 找到共用的大图灯箱容器。
const lightbox = document.querySelector("#lightbox");

// 找到灯箱中用来显示当前作品的大图元素。
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");

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

// 灯箱当前浏览的数据列表：项目页来自 DOM，首页来自 Content Service 的筛选结果。
let activeLightboxPhotos = [];

// 记录灯箱当前显示的是 activeLightboxPhotos 中的第几张照片。
let currentImageIndex = 0;

// 把独立项目页现有 DOM 转成与 Content Service 相同的最小照片数据格式。
let staticLightboxPhotos = [];

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
    if (activeLightboxPhotos.length === 0 || !lightboxImage) return;

    // 取余运算让最后一张的下一张回到开头，第一张的上一张回到末尾。
    currentImageIndex = (index + activeLightboxPhotos.length) % activeLightboxPhotos.length;

    // 首页读取 Content Service；独立作品页读取上面从 DOM 整理出的同形数据。
    const photo = activeLightboxPhotos[currentImageIndex];

    // 优先显示数据中的大图路径；没有提供时才回退到卡片图片。
    lightboxImage.src = photo.fullSrc || photo.src;

    // 把照片说明同步给灯箱大图。
    lightboxImage.alt = photo.alt || photo.title || "Photography work";
    if (lightboxCaption) lightboxCaption.textContent = photo.title || photo.alt || "";
}

// 同一个 openLightbox 同时接收首页 Content Service 数据与项目页整理出的照片数据。
function openLightbox(photo, trigger, photoList) {
    if (!lightbox || !lightboxClose || photoList.length === 0) return;

    activeLightboxPhotos = photoList;

    // 按照被点击照片在当前可见列表中的索引更新灯箱内容。
    showLightboxImage(photoList.indexOf(photo));

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

// 只给不会重新渲染的项目页照片直接绑定；首页动态照片由 Gallery 容器委托。
function setupStaticLightbox() {
    lightboxTriggers = [...document.querySelectorAll(".lightbox-trigger")].filter((trigger) => (
        !galleryContainer || !galleryContainer.contains(trigger)
    ));

    staticLightboxPhotos = lightboxTriggers.map((trigger) => {
        const image = trigger.querySelector("img");

        return {
            src: image.currentSrc || image.src,
            fullSrc: trigger.dataset.fullSrc || image.currentSrc || image.src,
            title: image.alt
        };
    });

    lightboxTriggers.forEach((trigger, index) => {
        // button 原生支持鼠标点击，以及键盘 Enter 和 Space 激活。
        trigger.addEventListener("click", () => {
            openLightbox(staticLightboxPhotos[index], trigger, staticLightboxPhotos);
        });
    });
}

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

// A horizontal swipe on the image moves between photos; vertical gestures are ignored.
let lightboxTouchStart = null;

lightboxImage?.addEventListener("touchstart", (event) => {
    if (!lightbox?.classList.contains("active") || event.touches.length !== 1) return;
    lightboxTouchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });

lightboxImage?.addEventListener("touchend", (event) => {
    if (!lightboxTouchStart || event.changedTouches.length !== 1) return;

    const distanceX = event.changedTouches[0].clientX - lightboxTouchStart.x;
    const distanceY = event.changedTouches[0].clientY - lightboxTouchStart.y;
    lightboxTouchStart = null;

    if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    showLightboxImage(currentImageIndex + (distanceX < 0 ? 1 : -1));
}, { passive: true });

lightboxImage?.addEventListener("touchcancel", () => { lightboxTouchStart = null; });

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

// 查询系统是否要求减少动画，保护容易晕动的访问者。
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 整个页面只创建一个 Observer；Gallery 每次 render 后复用它注册新卡片。
let revealObserver = null;

function observeRevealElements(root = document) {
    if (!revealObserver) return;

    root.querySelectorAll(".reveal:not(.active)").forEach((element) => {
        revealObserver.observe(element);
    });
}

// 不支持观察器时不添加 .js，CSS 会让所有作品保持可见，避免内容消失。
if ("IntersectionObserver" in window && !prefersReducedMotion) {
    // 创建观察器，浏览器会在元素进入或离开视口时调用回调函数。
    revealObserver = new IntersectionObserver(
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

    // 先观察 HTML 原本存在的标题和作品卡片。
    observeRevealElements();
}

// Collection 页面先异步生成照片按钮；完成后再绑定共用 Lightbox。
async function initPageContent() {
    if (window.collectionPageReady) await window.collectionPageReady;

    setupStaticLightbox();
    await initGallery();
}

initPageContent();
