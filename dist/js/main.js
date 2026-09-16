// 找到所有画廊缩略图；querySelectorAll 会返回可逐个处理的图片集合。
const galleryImages = document.querySelectorAll(".gallery-item img");

// 以下三个变量保存灯箱容器、大图元素和关闭按钮，后面的事件会重复使用它们。
const lightbox = document.querySelector("#lightbox");

const lightboxImage = document.querySelector("#lightbox-image");

const lightboxClose = document.querySelector("#lightbox-close");

/*
    给每一张作品图绑定同一种点击处理函数，避免为九张图片写九次相同逻辑。
    回调参数 image 始终代表当前被遍历到的那一张缩略图。
*/
galleryImages.forEach((image) => {

    image.addEventListener("click", () => {

        // 先添加 active class；CSS 以这个状态决定遮罩是否可见。
        lightbox.classList.add("active");

        /*
            再把当前缩略图的信息交给大图元素。
            这样同一个灯箱容器能展示任何一张作品，而无需为每张作品创建一套灯箱 HTML。
        */
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;

    });

});
// 关闭按钮只负责移除显示状态；图片地址保留不会影响下次重新打开时被新图片覆盖。
lightboxClose.addEventListener("click", () => {

    lightbox.classList.remove("active");

});
/*
    event.target 是实际被点击的最内层元素。
    只有它刚好等于 lightbox 背景容器时才关闭，因此点击其中的图片不会误关灯箱。
*/
lightbox.addEventListener("click", (event) => {

    if (event.target === lightbox) {

        lightbox.classList.remove("active");

    }

});
// 监听整个页面而不是单个按钮，让用户即使没有把焦点放在按钮上也能按 Escape 关闭。
document.addEventListener("keydown", (event) => {

    // 只响应 Escape；其他键不会改变灯箱状态。
    if (event.key === "Escape") {

        lightbox.classList.remove("active");

    }

});

// 找到移动端菜单按钮和需要显示、隐藏的导航列表。
const menuToggle = document.querySelector("#menu-toggle");

const navLinks = document.querySelector("#nav-links");

/*
    toggle 会在没有 active 时添加它、已有 active 时删除它。
    CSS 根据同一个 active 状态显示或隐藏全屏菜单，因此 JavaScript 不需要直接改 opacity 等样式。
*/
menuToggle.addEventListener("click", () => {

    navLinks.classList.toggle("active");

    /*
        toggle 完成后再读取状态：active 存在代表菜单已打开，按钮就显示 ×；
        否则恢复 ☰。这一步只同步按钮外观，不参与菜单本身的显示逻辑。
    */
    if (navLinks.classList.contains("active")) {

        menuToggle.textContent = "×";

    } else {

        menuToggle.textContent = "☰";

    }

});

/*
    找到全部导航链接。桌面端点击它们只会进行普通的页内跳转；
    手机上则额外收起覆盖全屏的菜单，避免跳转后遮罩仍留在页面上。
*/
const navItems = document.querySelectorAll(".nav-links a");
navItems.forEach((item) => {

    item.addEventListener("click", () => {

        // 点击任意链接后清除 active，恢复默认关闭状态。
        navLinks.classList.remove("active");

        menuToggle.textContent = "☰";

    });

});
