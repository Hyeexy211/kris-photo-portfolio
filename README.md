# Kris Photography：初学者代码阅读指南

这是一个不依赖框架的摄影作品集。首页展示三个作品卡片，点击后进入 `projects/` 中的独立页面浏览完整照片组。HTML 负责内容结构，CSS 负责外观与响应式布局，JavaScript 负责灯箱、手机菜单和滚动动画。图片保存在 `images/` 下，`dist/` 是给 Sites 预览和托管使用的同内容副本。

## 建议阅读顺序

1. 从 `index.html` 开始：先看 `<head>`，再依次看页头、Hero、Selected Work 卡片、About 和页脚。每张卡片的 `href` 指向 `projects/` 中的一页。
2. 打开 `projects/portrait.html`，沿着页头、项目介绍、照片 `<figure>`、项目资料、灯箱和页脚阅读。子页面的 `../` 表示返回项目根目录。
3. 再看 `css/style.css`：从 `:root` 设计变量开始，依次看全局规则、页头、Hero、灯箱、手机布局、动画、作品卡片和项目页。
4. 最后看 `js/main.js`：先看如何取得元素，再看 `openLightbox` / `closeLightbox`、`setMenuOpen`、键盘事件和滚动观察器。首页没有灯箱元素，因此代码会先检查它是否存在。

源码里的中文注释紧挨着对应的标签、样式规则或 JavaScript 语句。阅读时可以先看注释，再看下面一行代码，最后在浏览器里观察它的效果。空行和闭合符号属于代码结构，不需要单独的功能说明。

## 文件之间如何协作

| 文件或目录 | 作用 | 初学者重点 |
| --- | --- | --- |
| `index.html` | 定义首页与作品入口 | `article`、整张卡片链接、`srcset`、`aria-*` |
| `projects/*.html` | 每个分类一页，展示完整照片组 | `../` 相对路径、`figure`、灯箱按钮 |
| `css/style.css` | 布局、颜色、动画和响应式 | 选择器、Grid、Flexbox、媒体查询 |
| `js/main.js` | 用户交互 | DOM 查询、事件监听、函数、状态 class |
| `images/` | 网站使用的摄影图片 | 路径和文件名大小写必须一致 |
| `.openai/hosting.json` | Sites 静态托管配置 | `project_id` 绑定现有 Site，`dist` 是托管目录 |
| `dist/` | 可预览的静态副本 | 不要只改这里，先改根目录源码再同步 |

## 第 19～20 课：作品页与卡片

- `index.html` 的 `#work` 只放作品入口。每个 `<article class="project-card">` 都有封面、标题、照片数量和指向独立页面的链接。
- `projects/portrait.html`、`projects/documentary.html`、`projects/landscape.html` 分别展示三张现有照片。每页的 `../css/style.css`、`../images/...` 都从 `projects/` 返回到项目根目录。
- 当前仓库没有课程示例的京都照片，因此没有添加空白的 `Kyoto Night` 页面，也没有填写未经确认的拍摄地点、年份或器材。以后有真实素材时，可以参照现有作品页复制一份，再在首页添加对应卡片。

## 现有交互与可访问性

- 原先 CSS 和 JavaScript 有 `.reveal` 滚动动画逻辑，但 HTML 没有使用 `.reveal`，所以动画从未启动。现在作品标题和图片都已接入；如果浏览器不支持观察器或用户选择减少动画，内容仍会直接显示。
- 作品页图片放在真正的 `button` 中，Enter 和 Space 都能打开灯箱；首页卡片使用链接，键盘也能打开项目页。
- 灯箱原先不管理焦点或辅助技术状态。现在打开时聚焦关闭按钮，关闭时把焦点还给原作品；Tab 不会跑到背后页面。
- 手机菜单原先打开状态只改变图标，没有同步 `aria-expanded`，按 Escape 也不能关闭。现在状态统一由 `setMenuOpen` 管理，Esc 可关闭，宽屏切换时也会清理残留状态。
- 固定页头可能遮住页内导航目标。现在 `scroll-padding-top` 为标题预留了空间。
- 网站图标使用 `images/favicon/favicon.png`，社交分享图使用 `images/social/social-cover.png`。
- 人像图片路径与文件名的大小写保持一致，适合 Sites 的大小写敏感托管环境。

## 本地检查

在项目根目录执行：

```sh
node --check js/main.js
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

然后打开 `http://127.0.0.1:4173/`，检查三个作品卡片是否分别打开 Portrait、Documentary、Landscape 页面；在每页点开照片检查灯箱，并检查手机菜单与返回首页链接。第二条命令会持续运行；要停止它，在对应终端按 `Ctrl+C`。

`dist/` 是静态托管副本。修改根目录中的首页、项目页、样式或脚本后，预览前要将对应文件同步到 `dist/`，否则你可能看到旧版本。

`640`、`1200`、`1800` 三组 WebP 已按文件名生成真实宽度。浏览器会结合 `srcset` 和 `sizes` 选择合适版本，手机无需再下载原尺寸照片；30 个响应式文件的总大小由约 128 MiB 降至约 6.4 MiB。

## 容易混淆的三组概念

- `id` 与 `class`：同一个 `id` 在页面中只出现一次，适合导航目标或 JavaScript 精确查找；同一个 `class` 可以给多个元素复用，例如三页共同使用的 `.project-image`。
- `src` 与 `alt`：`src` 是图片文件地址；`alt` 是图片无法显示或由读屏软件阅读时使用的文字。作品页使用具体画面描述，不只写照片编号。
- CSS 状态与 JavaScript 状态：JavaScript 负责添加或删除 `active`，CSS 决定这个状态具体如何显示。这样交互逻辑和视觉表现不会混在一起。
- 固定值与设计变量：颜色、页面边距、区块间距和常用动画时长集中写在 `:root` 中；组件通过 `var(--变量名)` 使用它们，后续调整整站风格时只改一处。
Built and maintained by Kris.
