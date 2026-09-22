// ================================================================
// Collection 数据层
// 这个文件只描述网站有哪些作品集，不负责创建页面结构。
// 未经确认的年份、地点和时间继续保留为空，不根据文件信息猜测。
// ================================================================

const collections = [
    {
        id: "portrait",
        slug: "portrait",
        title: "Portrait",
        description: "Rainy windows, reflected light and quiet moments observed from indoors.",
        cover: "images/portrait/portrait-01-1200.webp",
        coverSrcset: "images/portrait/portrait-01-640.webp 640w, images/portrait/portrait-01-1200.webp 1200w, images/portrait/portrait-01-1800.webp 1800w",
        coverAlt: "A rain-darkened window frames trees and a passing car",
        coverWidth: 1200,
        coverHeight: 1800,
        year: "",
        location: "",
        category: "portrait",
        order: 1,
        createdAt: "",
        updatedAt: ""
    },
    {
        id: "documentary",
        slug: "documentary",
        title: "Documentary",
        description: "Quiet interiors, plants and objects observed in soft light.",
        cover: "images/documentary/documentary-01-1200.webp",
        coverSrcset: "images/documentary/documentary-01-640.webp 640w, images/documentary/documentary-01-1200.webp 1200w, images/documentary/documentary-01-1800.webp 1800w",
        coverAlt: "White flowers and a veiled mannequin beside an old window",
        coverWidth: 1200,
        coverHeight: 1800,
        year: "",
        location: "",
        category: "documentary",
        order: 2,
        createdAt: "",
        updatedAt: ""
    },
    {
        id: "landscape",
        slug: "landscape",
        title: "Landscape",
        description: "Three views of city light, changing skies and a garden path.",
        cover: "images/landscape/landscape-01-1200.webp",
        coverSrcset: "images/landscape/landscape-01-640.webp 640w, images/landscape/landscape-01-1200.webp 1200w, images/landscape/landscape-01-1800.webp 1800w",
        coverAlt: "City lights beneath a pink dusk sky and silhouetted branches",
        coverWidth: 1200,
        coverHeight: 511,
        year: "",
        location: "",
        category: "landscape",
        order: 3,
        createdAt: "",
        updatedAt: ""
    }
];
