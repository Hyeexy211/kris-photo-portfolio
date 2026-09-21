// ================================================================
// 第 24 课：数据驱动 Gallery
// 这个文件只描述“有哪些照片”；页面结构由 js/main.js 根据这些数据创建。
// ================================================================

// photos 是一个数组，可以把它理解成存放照片资料的盒子。
const photos = [
    {
        id: "portrait-001",
        src: "images/portrait/portrait-01-1200.webp",
        srcset: "images/portrait/portrait-01-640.webp 640w, images/portrait/portrait-01-1200.webp 1200w, images/portrait/portrait-01-1800.webp 1800w",
        title: "A rain-darkened window frames trees and a passing car",
        date: "",
        category: "portrait",
        width: 1200,
        height: 1800
    },
    {
        id: "portrait-002",
        src: "images/portrait/portrait-02-1200.webp",
        srcset: "images/portrait/portrait-02-640.webp 640w, images/portrait/portrait-02-1200.webp 1200w, images/portrait/portrait-02-1800.webp 1800w",
        title: "Rain and trees seen through a softly lit window",
        date: "",
        category: "portrait",
        width: 1200,
        height: 1800
    },
    {
        id: "portrait-003",
        src: "images/portrait/portrait-03-1200.webp",
        srcset: "images/portrait/portrait-03-640.webp 640w, images/portrait/portrait-03-1200.webp 1200w, images/portrait/portrait-03-1800.webp 1800w",
        title: "A glowing wall lamp beside a rain-covered garden window",
        date: "",
        category: "portrait",
        width: 1200,
        height: 1800
    },
    {
        id: "documentary-001",
        src: "images/documentary/documentary-01-1200.webp",
        srcset: "images/documentary/documentary-01-640.webp 640w, images/documentary/documentary-01-1200.webp 1200w, images/documentary/documentary-01-1800.webp 1800w",
        title: "White flowers and a veiled mannequin beside an old window",
        date: "",
        category: "documentary",
        width: 1200,
        height: 1800
    },
    {
        id: "documentary-002",
        src: "images/documentary/documentary-02-1200.webp",
        srcset: "images/documentary/documentary-02-640.webp 640w, images/documentary/documentary-02-1200.webp 1200w, images/documentary/documentary-02-1800.webp 1800w",
        title: "Plants and a chandelier in a weathered indoor courtyard",
        date: "",
        category: "documentary",
        width: 1200,
        height: 800
    },
    {
        id: "documentary-003",
        src: "images/documentary/documentary-03-1200.webp",
        srcset: "images/documentary/documentary-03-640.webp 640w, images/documentary/documentary-03-1200.webp 1200w, images/documentary/documentary-03-1800.webp 1800w",
        title: "Jewelry, mirrors and a painted hand arranged on a table",
        date: "",
        category: "documentary",
        width: 1200,
        height: 800
    },
    {
        id: "landscape-001",
        src: "images/landscape/landscape-01-1200.webp",
        srcset: "images/landscape/landscape-01-640.webp 640w, images/landscape/landscape-01-1200.webp 1200w, images/landscape/landscape-01-1800.webp 1800w",
        title: "City lights beneath a pink dusk sky and silhouetted branches",
        date: "",
        category: "landscape",
        width: 1200,
        height: 511
    },
    {
        id: "landscape-002",
        src: "images/landscape/landscape-02-1200.webp",
        srcset: "images/landscape/landscape-02-640.webp 640w, images/landscape/landscape-02-1200.webp 1200w, images/landscape/landscape-02-1800.webp 1800w",
        title: "Crescent moon above distant mountains in a purple evening sky",
        date: "",
        category: "landscape",
        width: 1200,
        height: 1800
    },
    {
        id: "landscape-003",
        src: "images/landscape/landscape-03-1200.webp",
        srcset: "images/landscape/landscape-03-640.webp 640w, images/landscape/landscape-03-1200.webp 1200w, images/landscape/landscape-03-1800.webp 1800w",
        title: "Stone steps lead through a wooden gate framed by pink flowers",
        date: "",
        category: "landscape",
        width: 1200,
        height: 600
    }
];
