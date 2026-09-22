# Kris Photography：初学者代码阅读指南

这是一个不依赖框架的摄影作品集。首页的 Collection 卡片与下方可筛选 Gallery 都由内容数据生成；点击作品卡片后，通用的 `collection.html?slug=...` 模板会显示对应 Collection 及其照片。HTML 负责稳定的页面结构，CSS 负责外观与响应式布局，JavaScript 负责内容渲染、灯箱、手机菜单和滚动动画。图片保存在 `images/` 下，`dist/` 是给 Sites 预览和托管使用的同内容副本。

## 建议阅读顺序

1. 从 `index.html` 开始：先看 `<head>`，再依次看页头、Hero、Selected Work 容器、动态 Gallery、About 和页脚。
2. 打开 `data/collections.js` 与 `data/photos.js`：Collection 描述作品集，Photo 通过 `collectionId` 指向所属作品集。
3. 打开 `js/content-service.js`：页面通过这里的查询函数读取内容，而不在 UI 代码中到处直接访问数据数组。
4. 再看 `js/work.js` 和 `collection.html` / `js/collection-page.js`：前者生成首页卡片，后者用一个页面模板显示所有 Collection。
5. 接着看 `css/style.css`：现有的作品卡片、项目页、灯箱和响应式样式同时服务于静态页面与动态页面。
6. 最后看 `js/main.js`：先看动态 Gallery，再看 `openLightbox` / `closeLightbox`、`setMenuOpen`、键盘事件和滚动观察器。

源码里的中文注释紧挨着对应的标签、样式规则或 JavaScript 语句。阅读时可以先看注释，再看下面一行代码，最后在浏览器里观察它的效果。空行和闭合符号属于代码结构，不需要单独的功能说明。

## 文件之间如何协作

| 文件或目录 | 作用 | 初学者重点 |
| --- | --- | --- |
| `index.html` | 定义首页的稳定容器 | 语义区块、脚本加载顺序、`aria-*` |
| `data/collections.js` | 保存 Collection 资料与显示顺序 | `id`、`slug`、`cover`、`order` |
| `data/photos.js` | 保存照片资料及 Collection 外键 | `id`、`src`、`category`、`collectionId` |
| `js/content-service.js` | 统一查询 Collection 与 Photo | 数据访问边界、数组副本、关联查询 |
| `js/work.js` | 根据 Collection 数量生成首页卡片 | `createWorkCard()`、`renderWorks()` |
| `collection.html`、`js/collection-page.js` | 通用作品集模板及其渲染逻辑 | URL 参数、slug 查询、动态照片按钮 |
| `projects/*.html` | 保留的旧静态作品页 | 兼容已有 URL，不再是新增 Collection 的必需步骤 |
| `css/style.css` | 布局、颜色、动画和响应式 | 选择器、Grid、Flexbox、媒体查询 |
| `js/main.js` | 动态渲染与用户交互 | DOM 创建、筛选、事件监听、函数、状态 class |
| `images/` | 网站使用的摄影图片 | 路径和文件名大小写必须一致 |
| `.openai/hosting.json` | Sites 静态托管配置 | `project_id` 绑定现有 Site，`dist` 是托管目录 |
| `dist/` | 可预览的静态副本 | 不要只改这里，先改根目录源码再同步 |

## 第 19～20 课：作品页与卡片（历史实现）

- 这一阶段最初在 `index.html` 中手写三个 `<article class="project-card">`，并分别链接三个静态页面。
- `projects/portrait.html`、`projects/documentary.html`、`projects/landscape.html` 分别展示三张现有照片。每页的 `../css/style.css`、`../images/...` 都从 `projects/` 返回到项目根目录。
- 当前仓库没有课程示例的京都照片，因此没有添加空白的 `Kyoto Night` 页面，也没有填写未经确认的拍摄地点、年份或器材。以后有真实素材时，可以参照现有作品页复制一份，再在首页添加对应卡片。

## 第 27～32 课：CMS 内容架构基础

- `data/collections.js` 是 Collection 的唯一基础数据源；`order` 决定首页显示顺序，数量不再写死在 HTML 中。
- `js/work.js` 的 `createWorkCard()` 与 `renderWorks()` 复用原来的 `.project-card` DOM 结构和 CSS，因此视觉与响应式行为保持不变。
- 每张 Photo 使用 `collectionId` 建立一对多关系；Collection 不复制完整 Photo 对象，没有 `collectionId` 的 Photo 仍可保留在总 Gallery 中。
- `js/content-service.js` 提供 `getPhotos()`、`getCollections()`、`getCollectionById()`、`getCollectionBySlug()` 与 `getPhotosByCollection()`。未来替换存储方式时，页面 UI 尽量不改。
- `collection.html?slug=portrait`、`collection.html?slug=documentary` 与 `collection.html?slug=landscape` 共用一个模板。新增 Collection 时不再必须新建 HTML 页面。
- `projects/*.html` 目前继续保留，避免删除已有页面和破坏旧链接；确认通用模板长期稳定后再决定是否设置迁移策略。
- 这一阶段仍是静态 JavaScript 数据。GitHub Pages 不能把浏览器中的编辑直接写回仓库；Admin、localStorage 原型、数据库、图片存储和登录属于后续课程。

## 第 22 课：照片数据层

- `data/photos.js` 是网站的照片数据层，记录九张真实作品的路径、标题、分类与响应式图片信息，不负责视觉布局。
- 没有经过确认的拍摄日期继续保留为空；`createPhotoCard()` 会跳过空日期，不编造地点、日期或器材资料。
- `index.html` 会依次加载 Collection、Photo、Content Service、Work 渲染与主脚本；依赖顺序清楚后，Gallery 才开始读取照片并生成页面。

## 第 24～25 课：数据驱动 Gallery 正式接入

- `createPhotoCard(photo)` 使用 `document.createElement()` 把一条照片数据转换成正式的 `.gallery-item.lightbox-trigger.reveal` 照片按钮，继续复用原 Gallery 的样式、Hover、响应式与键盘行为。
- `renderGallery(photoList)` 使用 `replaceChildren()` 一次替换旧内容，再逐张调用 `createPhotoCard()`；空数组会显示 `No photos found.`，不会与旧卡片叠加。
- All、Street、Portrait、Documentary 与 Landscape 按钮通过 Content Service 取得 Photo，再用 `filter()` 筛选，所以连续切换不会叠加或重复卡片。
- 仓库当前没有 Street 作品；保留课程要求的 Street 按钮用于真实演示空状态，但没有把 Documentary 照片错误改名或虚构 Street 素材。
- 首页的动态 Gallery 是浏览全部照片的入口；`photos.js` 保存基础 Photo 数据，UI 统一通过 Content Service 读取，`index.html` 只保留容器、筛选按钮和 Lightbox 结构。
- 首页 Lightbox 在持久存在的 Gallery 容器上使用事件委托，通过 `data-id` 回到 Content Service 查找数据；重新筛选后不需要重复绑定监听器。
- 动态创建的 `.reveal` 会在每次 render 后交给页面共用的同一个 `IntersectionObserver`，不会为每次筛选重复创建观察器。

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
node --check data/photos.js
node --check data/collections.js
node --check js/content-service.js
node --check js/work.js
node --check js/collection-page.js
node --check js/main.js
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

然后打开 `http://127.0.0.1:4173/`，检查三个作品卡片是否分别打开通用 Collection 页面；也可直接访问 `collection.html?slug=portrait`。在每页点开照片检查灯箱，并检查手机菜单与返回首页链接。HTTP server 命令会持续运行；要停止它，在对应终端按 `Ctrl+C`。

`dist/` 是静态托管副本。修改根目录中的首页、项目页、样式或脚本后，预览前要将对应文件同步到 `dist/`，否则你可能看到旧版本。

`640`、`1200`、`1800` 三组 WebP 已按文件名生成真实宽度。浏览器会结合 `srcset` 和 `sizes` 选择合适版本，手机无需再下载原尺寸照片；30 个响应式文件的总大小由约 128 MiB 降至约 6.4 MiB。

## 容易混淆的三组概念

- `id` 与 `class`：同一个 `id` 在页面中只出现一次，适合导航目标或 JavaScript 精确查找；同一个 `class` 可以给多个元素复用，例如三页共同使用的 `.project-image`。
- `src` 与 `alt`：`src` 是图片文件地址；`alt` 是图片无法显示或由读屏软件阅读时使用的文字。作品页使用具体画面描述，不只写照片编号。
- CSS 状态与 JavaScript 状态：JavaScript 负责添加或删除 `active`，CSS 决定这个状态具体如何显示。这样交互逻辑和视觉表现不会混在一起。
- 固定值与设计变量：颜色、页面边距、区块间距和常用动画时长集中写在 `:root` 中；组件通过 `var(--变量名)` 使用它们，后续调整整站风格时只改一处。
Built and maintained by Kris.
