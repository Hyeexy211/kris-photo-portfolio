# Kris Photography：初学者代码阅读指南

这是一个不依赖框架的摄影作品集。页面由 HTML 负责内容结构，CSS 负责外观与响应式布局，JavaScript 负责灯箱、手机菜单和滚动动画。图片保存在 `images/` 下，`dist/` 是给 Sites 预览和托管使用的同内容副本。

## 建议阅读顺序

1. 从 `index.html` 开始：先看 `<head>`，再依次看页头、Hero、三个作品区、About、灯箱和页脚。理解 `id` 如何连接导航链接、CSS 选择器和 JavaScript。
2. 再看 `css/style.css`：它从 `:root` 设计变量开始，再按全局规则、页头、Hero、画廊、灯箱、手机布局、动画的顺序组织。把 `.class` 理解为可复用样式，把 `#id` 理解为页面里唯一的元素。
3. 最后看 `js/main.js`：先看如何取得元素，再看 `openLightbox` / `closeLightbox`、`setMenuOpen`、键盘事件和滚动观察器。每个函数只处理一类状态，便于定位问题。

源码里的中文注释紧挨着对应的标签、样式规则或 JavaScript 语句。阅读时可以先看注释，再看下面一行代码，最后在浏览器里观察它的效果。空行和闭合符号属于代码结构，不需要单独的功能说明。

## 文件之间如何协作

| 文件或目录 | 作用 | 初学者重点 |
| --- | --- | --- |
| `index.html` | 定义页面内容和语义 | `section`、`id`、`class`、`button`、`aria-*` |
| `css/style.css` | 布局、颜色、动画和响应式 | 选择器、Grid、Flexbox、媒体查询 |
| `js/main.js` | 用户交互 | DOM 查询、事件监听、函数、状态 class |
| `images/` | 摄影作品原图 | 路径和文件名大小写必须一致 |
| `.openai/hosting.json` | Sites 静态托管配置 | `project_id` 绑定现有 Site，`dist` 是托管目录 |
| `dist/` | 可预览的静态副本 | 不要只改这里，先改根目录源码再同步 |

## 这次修复的具体问题

- 原先 CSS 和 JavaScript 有 `.reveal` 滚动动画逻辑，但 HTML 没有使用 `.reveal`，所以动画从未启动。现在作品标题和图片都已接入；如果浏览器不支持观察器或用户选择减少动画，内容仍会直接显示。
- 原先作品图片只有鼠标点击事件，键盘不能打开。现在每张图片放在真正的 `button` 中，Enter 和 Space 都能打开灯箱。
- 灯箱原先不管理焦点或辅助技术状态。现在打开时聚焦关闭按钮，关闭时把焦点还给原作品；Tab 不会跑到背后页面。
- 手机菜单原先打开状态只改变图标，没有同步 `aria-expanded`，按 Escape 也不能关闭。现在状态统一由 `setMenuOpen` 管理，Esc 可关闭，宽屏切换时也会清理残留状态。
- 固定页头可能遮住页内导航目标。现在 `scroll-padding-top` 为标题预留了空间。
- 缺少网站图标导致浏览器请求 `/favicon.ico` 返回 404。现在图标以内嵌 SVG 提供，不增加额外文件。
- 人像图片路径与文件名的大小写保持一致，适合 Sites 的大小写敏感托管环境。

## 本地检查

在项目根目录执行：

```sh
node --check js/main.js
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

然后打开 `http://127.0.0.1:4173/`，依次检查导航、九张作品图片、灯箱、手机菜单与页面滚动。第二条命令会持续运行；要停止它，在对应终端按 `Ctrl+C`。

`dist/` 是静态托管副本。修改根目录中的 `index.html`、`css/style.css` 或 `js/main.js` 后，预览前要将对应文件同步到 `dist/`，否则你可能看到旧版本。

## 容易混淆的三组概念

- `id` 与 `class`：同一个 `id` 在页面中只出现一次，适合导航目标或 JavaScript 精确查找；同一个 `class` 可以给多个元素复用，例如九个 `.gallery-item`。
- `src` 与 `alt`：`src` 是图片文件地址；`alt` 是图片无法显示或由读屏软件阅读时使用的文字。正式展示摄影作品时，可以把当前编号式 `alt` 改成更具体的画面描述。
- CSS 状态与 JavaScript 状态：JavaScript 负责添加或删除 `active`，CSS 决定这个状态具体如何显示。这样交互逻辑和视觉表现不会混在一起。
- 固定值与设计变量：颜色、页面边距、区块间距和常用动画时长集中写在 `:root` 中；组件通过 `var(--变量名)` 使用它们，后续调整整站风格时只改一处。
Built and maintained by Kris.