# Kris Photography：初学者代码阅读指南

这是一个不依赖框架的摄影作品集。首页通过 Content Service 读取作品集与照片，并在下方生成可筛选 Gallery；点击作品卡片后会进入通用的 `collection.html?slug=...` 页面。HTML 负责内容结构，CSS 负责外观与响应式布局，JavaScript 负责数据读取、动态渲染、灯箱、手机菜单和滚动动画。图片保存在 `images/` 下，`dist/` 是给 Sites 预览和托管使用的同内容副本。

## 当前项目状态（2026-09-23）

- 当前稳定检查点是第 34 课：公开页面已经通过 Content Service 和 Repository 从 Supabase 只读加载 3 个作品集与 9 张照片。
- Supabase 的 Collections 或 Photos 任一读取失败时，两组资料会一起回退到浏览器本地种子，避免一页混用不同来源；页面不直接依赖数据库 SDK。
- `admin.html` 是第 33 课的浏览器本地原型，可以用 localStorage 新增、编辑、删除和恢复内容，但没有登录、云端写入或跨设备同步。
- 工作分支另提供 `admin.html?mode=cloud` 的认证界面及云端 CRUD 代码，并准备了数据库 RLS 迁移；迁移尚未在线上执行，尚不能宣称云端 Admin 可用。原本的 `admin.html` 本地模式保持可用。
- GitHub Pages 已发布在 <https://hyeexy211.github.io/kris-photo-portfolio/>，桌面端、390px 移动端、筛选、动态 Collection、Lightbox 与云端失败回退已经过部署后验证。
- 原片按目前决定继续留在仓库；LCP/CLS、Lighthouse 和 200 张模拟卡片已在本地测试，真实访客性能数据仍未完成。云端 Admin 尚待真实账号和迁移验证；对象存储已准备空桶策略与浏览器网页图上传代码，尚未在线上连接和测试。
- 现有 9 张照片页按你的选择提供 1200px WebP 网页尺寸下载；按钮不指向 1800px 展示图或原片。仓库公开且保留原片，所以这不等于原片受保护。
- `scripts/export-public-content.js` 可把 Supabase 的公开作品集和照片资料导出到仓库外的 JSON，供人工留存；它不包含图片、Auth 用户或数据库策略，完整备份和恢复仍需在服务端验证。
- `Weblesson.docx` 目前完整写到第 18 课并预告第 19 课，尚未同步第 19～34 课的教学内容。

## 建议阅读顺序

1. 从 `index.html` 开始：先看 `<head>`，再依次看页头、Hero、Selected Work 容器、动态 Gallery、About、页脚和末尾的脚本加载顺序。
2. 打开 `data/collections.js` 与 `data/photos.js`：先认识本地种子数组，再看真实作品如何用 `id`、关联字段、图片路径与现有元数据描述。
3. 打开 `js/content-service.js`：观察页面如何用同一组异步方法读取本地仓库或 Supabase 仓库，而不把数据库查询写进 UI。
4. 再看 `css/style.css`：从 `:root` 设计变量开始，依次看全局规则、页头、Hero、灯箱、手机布局、动画、作品卡片和项目页。
5. 最后看 `js/main.js`：先看如何取得元素，再看 `openLightbox` / `closeLightbox`、`setMenuOpen`、键盘事件和滚动观察器。这个脚本被首页和静态作品页共用，所以读取可选元素时会先确认它是否存在。

源码里的中文注释紧挨着对应的标签、样式规则或 JavaScript 语句。阅读时可以先看注释，再看下面一行代码，最后在浏览器里观察它的效果。空行和闭合符号属于代码结构，不需要单独的功能说明。

## 文件之间如何协作

| 文件或目录 | 作用 | 初学者重点 |
| --- | --- | --- |
| `index.html` | 定义首页与作品入口 | `article`、整张卡片链接、`srcset`、`aria-*` |
| `data/*.js` | 保存浏览器本地种子资料 | 数组、对象、`id`、`collectionId`、真实图片路径 |
| `js/content-service.js` | 为 UI 提供统一内容读取接口 | `async/await`、数据源切换、失败回退 |
| `js/repositories/*.js` | 分别读取 localStorage 与 Supabase | Repository 边界、字段映射、只读查询 |
| `js/cloud-photo-upload.js` | 在 Cloud Admin 中生成并上传新照片的 3 张 WebP 网页图 | 文件验证、Canvas 导出、Storage 路径与失败清理；需真实账号和桶测试 |
| `collection.html` | 按 `slug` 展示一个作品集 | URL 参数、异步状态、动态 Lightbox 按钮 |
| `css/style.css` | 布局、颜色、动画和响应式 | 选择器、Grid、Flexbox、媒体查询 |
| `js/main.js` | 动态渲染与用户交互 | DOM 创建、筛选、事件监听、函数、状态 class |
| `images/` | 网站使用的摄影图片 | 路径和文件名大小写必须一致 |
| `.openai/hosting.json` | Sites 静态托管配置 | `project_id` 绑定现有 Site，`dist` 是托管目录 |
| `dist/` | 可预览的静态副本 | 不要只改这里，先改根目录源码再同步 |

## 第 19～20 课：作品页与卡片

- `index.html` 的 `#work` 只放作品入口。每个 `<article class="project-card">` 都有封面、标题、照片数量和指向独立页面的链接。
- `projects/portrait.html`、`projects/documentary.html`、`projects/landscape.html` 分别展示三张现有照片。每页的 `../css/style.css`、`../images/...` 都从 `projects/` 返回到项目根目录。
- 当前仓库没有课程示例的京都照片，因此没有添加空白的 `Kyoto Night` 页面，也没有填写未经确认的拍摄地点、年份或器材。以后有真实素材时，可以参照现有作品页复制一份，再在首页添加对应卡片。

## 第 22 课：照片数据层

- `data/photos.js` 是网站的照片数据层，记录九张真实作品的路径、标题、分类与响应式图片信息，不负责视觉布局。
- 没有经过确认的拍摄日期继续保留为空；`createPhotoCard()` 会跳过空日期，不编造地点、日期或器材资料。
- `index.html` 会先加载 `data/photos.js`，再加载 `js/main.js`，因此主脚本能够读取照片资料并自动生成 Gallery。

## 第 24～25 课：数据驱动 Gallery 正式接入

- `createPhotoCard(photo)` 使用 `document.createElement()` 把一条照片数据转换成正式的 `.gallery-item.lightbox-trigger.reveal` 照片按钮，继续复用原 Gallery 的样式、Hover、响应式与键盘行为。
- `renderGallery(photoList)` 使用 `replaceChildren()` 一次替换旧内容，再逐张调用 `createPhotoCard()`；空数组会显示 `No photos found.`，不会与旧卡片叠加。
- All、Street、Portrait、Documentary 与 Landscape 按钮通过 `filter()` 筛选同一个 `photos` 数组，所以连续切换不会叠加或重复卡片。
- 仓库当前没有 Street 作品；保留课程要求的 Street 按钮用于真实演示空状态，但没有把 Documentary 照片错误改名或虚构 Street 素材。
- 首页的动态 Gallery 是浏览全部照片的入口；`photos.js` 是首页作品的唯一数据源，`index.html` 只保留容器、筛选按钮和 Lightbox 结构。
- 首页 Lightbox 在持久存在的 Gallery 容器上使用事件委托，通过 `data-id` 回到 `photos` 查找数据；重新筛选后不需要重复绑定监听器。
- 动态创建的 `.reveal` 会在每次 render 后交给页面共用的同一个 `IntersectionObserver`，不会为每次筛选重复创建观察器。

## 第 34 课：Supabase 只读数据接入

- Work、Gallery 与通用 Collection 页面继续只调用 `contentService`，不会直接调用 Supabase。
- `js/repositories/supabase-repository.js` 是唯一包含数据库 `.from(...)` 查询的文件，并把数据库的 snake_case 字段转换回页面现有的 camelCase 数据结构。
- `js/repositories/local-repository.js` 保留 localStorage 与默认种子；当前正式配置优先使用 `supabase`，云端配置缺失或读取失败时会安全回退到本地仓库。
- 本课只开放 `SELECT`。Admin 的新增、编辑、删除继续保存在当前浏览器，不会写入 Supabase。
- 数据库表、外键、RLS、公开只读策略、真实种子和手动配置步骤见 `docs/supabase-setup.md`。

## 照片资料字段（浏览器本地原型）

- Admin 的 Gallery 表单可录入已确认的标签、说明、地点、日期和器材资料；标签以逗号分隔，保存后是数组。逐张照片页只显示有值的字段。
- 现有 9 张照片尚未补充未经确认的资料；GPS 不进入公开数据。字段定义和云端同步边界见 `docs/photo-metadata.md`。

## 现有交互与可访问性

- 首页 Gallery、通用 Collection 页和三个旧作品页的灯箱会显示已有照片标题；手机上可在大图上左右滑动切换照片。空的可选拍摄资料不会被编造或显示。
- 灯箱标题旁的 `View photo` 会为现有 9 张照片打开 `photos/照片ID.html`，每页初始 HTML 含独立标题、图片、Open Graph 和 ImageObject 资料，可供社交爬虫读取。通用 `photo.html?id=照片ID` 保留给未来的云端新照片；这种新照片要获得独立社交卡片，需加入静态发布流程。修改种子照片后运行 `node scripts/generate-photo-pages.js`；在 Cloud Admin 修改这 9 张照片后运行 `node scripts/generate-photo-pages.js --source=supabase`，检查生成差异，再将 `photos/` 与 `dist/` 一起发布。新增或删除照片还须检查 `sitemap.xml`。
- `sitemap.xml` 列出当前 3 个作品集、9 张静态照片页以及首页和旧作品页；新增内容后需要同步更新。`robots.txt` 随项目发布，但 GitHub Pages 的项目站点不能控制域名根路径的 `/robots.txt`，所以搜索引擎是否采用它还要在正式域名上验证。
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
