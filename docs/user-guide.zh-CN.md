# Kris Photography 使用说明

> 根据 2026-09-23 的 `feature/roadmap-completion` 分支整理。本说明区分仓库当前代码与已发布的 GitHub Pages：分支中的新功能需要合并、发布并检查后，才能视为线上可用。

## 1. 这是什么网站

这是一个用 HTML、CSS 和原生 JavaScript 制作的摄影作品集。访客可以浏览作品集和照片；站点所有者可以使用浏览器本地的内容编辑原型。当前仓库的默认内容是 **3 个作品集、9 张照片**，分别属于 Portrait、Documentary、Landscape。

公开站点首页、Gallery 和通用作品集页优先从 Supabase **只读**获取内容。如果任一组云端内容读取失败，页面会把作品集和照片一起切换到当前浏览器里的本地数据。这个回退只是保证页面还能显示，不代表本地编辑会自动上传到云端。

## 2. 访客怎样使用

公开地址：<https://hyeexy211.github.io/kris-photo-portfolio/>。这个地址已经有过发布和检查；本分支新增的功能仍以本地代码为准，发布状态见第 6 节。

| 目的 | 操作 | 当前结果 |
| --- | --- | --- |
| 看作品集 | 在首页点 **Collections** 中的 Portrait、Documentary 或 Landscape 卡片 | 进入 `collection.html?slug=...`，浏览该作品集的照片；三个旧版 `projects/*.html` 页面也保留。 |
| 看全部照片 | 点首页导航的 **Gallery** | 默认显示全部照片。 |
| 按类型筛选 | 在 Gallery 点 **All / Street / Portrait / Documentary / Landscape** | 只显示所选分类；目前没有 Street 照片，选它会显示 `No photos found.`。 |
| 放大照片 | 点 Gallery 或作品集中的照片 | 打开灯箱；用左右按钮或键盘 ← / → 切换，按 Esc 或点关闭按钮退出；手机可在大图上左右滑动。 |
| 看单张照片 | 在灯箱标题旁点 **View photo** | 现有 9 张照片进入各自的 `photos/照片ID.html` 页面。新增云端照片目前使用通用 `photo.html?id=照片ID`。 |
| 下载网页尺寸图 | 在现有照片的单张页面点 **Download web-size photo** | 下载仓库内对应的 1200px WebP 网页图；它不是 1800px 展示图或原片。新增云端照片暂不提供此按钮。 |
| 手机浏览 | 点页头菜单按钮 | 展开导航；选链接或按 Esc 可关闭。 |

有日期的照片会在首页 Gallery 中按日期从新到旧排列；没有有效日期的排在后面，并保持原有相对顺序。当前 9 张默认照片的拍摄日期均为空，因此不会凭文件时间推断拍摄日期。地点和器材等资料只有在已填写时才出现在单张照片页。

## 3. 网站所有者怎样试用本地内容编辑

1. 打开 `admin.html`，或在页面中点 **Browser-local editor**。此模式无需登录。
2. 在 **Manage Works** 中新增作品集，或在已有条目点 **Edit** 修改标题、slug、说明、封面路径、分类及显示顺序。点 **Save Work** 保存。
3. 在 **Manage Gallery** 中新增或编辑照片记录，可填写标题、图片路径、分类、作品集 ID、顺序，以及已确认的日期、地点、标签和器材信息。标签用英文逗号分隔。点 **Save Gallery Item** 保存。
4. 每条记录的 **Delete** 会先弹出确认。页面底部的 **Reset Content** 会在确认后把当前浏览器里的 Works 和 Gallery **全部恢复为仓库默认种子**，覆盖本地修改。

本地模式只把记录保存在当前浏览器的 `localStorage`。它不会修改 `data/` 文件、图片文件、Supabase、Git 仓库或其他设备。图片字段在本地模式填写的是**已有图片的相对路径**；表单不会把选中的图片文件上传进项目。路径必须真实存在且大小写一致，否则浏览器会显示坏图。

**当前容易误解的一点：**公开页面的配置优先读 Supabase。云端读取正常时，`admin.html` 的本地修改不会出现在公开首页和作品集页；只有页面使用本地数据源或触发本地回退时才可能看到这些记录。因此，不要把这个本地原型当作正式发布工具，也不要用它判断云端内容是否已经更新。

## 4. 本地预览与项目文件

在项目根目录运行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

然后在浏览器打开 `http://127.0.0.1:4173/` 看当前分支源码，或打开 `http://127.0.0.1:4173/admin.html` 试用本地编辑器。运行服务器的终端中按 `Ctrl+C` 停止。请通过 HTTP 地址预览，不要直接双击 HTML 文件；部分浏览器功能和资源加载行为在 `file://` 下不同。

| 位置 | 用途 |
| --- | --- |
| `index.html`、`collection.html`、`photo.html`、`photos/`、`projects/` | 首页、通用作品集页、通用照片页、9 张现有照片的独立页和保留的旧作品页。 |
| `data/collections.js`、`data/photos.js` | 浏览器本地默认内容；不要填写未经确认的拍摄资料。 |
| `js/content-service.js`、`js/repositories/` | 公开页面的数据读取和本地数据保存。 |
| `admin.html`、`js/admin.js` | 本地编辑原型及准备中的云端编辑界面。 |
| `images/`、`css/` | 真实照片、响应式网页图和页面样式。 |
| `dist/` | Sites 预览和托管所用的静态副本，已被 Git 忽略；它不等于根目录源码。 |

如果要预览 `dist/`，可改用 `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`。修改根目录源码后，要先同步对应文件到 `dist/`，否则看到的可能是旧内容。不要只修改 `dist/`。

## 5. 云端数据与 Cloud Admin 的现状

- **已经可用：**公开页面的 Supabase 只读数据。仓库中的 `collections`、`photos` 结构、默认种子和公开读取策略已有配置与实际读取记录。云端读取异常时会回退到浏览器本地内容。
- **已有代码，但尚未完成线上启用验证：**`admin.html?mode=cloud` 的邮箱密码登录、管理员身份检查、作品集和照片记录的云端增删改，以及新照片网页尺寸图上传。真实所有者账号、管理员 RLS 迁移、Storage 桶迁移和实地权限／上传／恢复检查仍待完成。现在不要依靠它管理正式照片。
- **新照片上传的设计边界：**准备中的表单接受符合条件的 JPEG、WebP 或 AVIF，浏览器会生成 640、1200、1800px 三份 WebP 网页图。原始文件不会由这个流程上传；云端删除照片记录也不会自动删除 Storage 里的网页图。详情见 [`supabase-admin-setup.md`](supabase-admin-setup.md) 与 [`supabase-storage-setup.md`](supabase-storage-setup.md)。

即使日后 Cloud Admin 可以写入 Supabase，它也不能直接改写 GitHub Pages 上的静态 HTML。现有 9 张照片的独立分享页及其社交预览资料需要重新生成、审核并发布；新云端照片暂时只有通用照片页。公开仓库中仍保留原片，因此网页尺寸下载限制**不等于**原片已受到保护。

## 6. 已实现、待验证和未实现

| 状态 | 功能 |
| --- | --- |
| 当前仓库已实现 | 响应式首页与手机导航；3 个作品集和 9 张照片；动态 Work / Gallery；分类筛选及空状态；照片灯箱、键盘和手机滑动；独立照片页；现有照片的 1200px WebP 下载；本地 Admin 新增／编辑／删除／重置；Supabase 公开只读和失败回退；`srcset` 响应式图片；基础 SEO、站点地图及 9 张照片的静态分享页。 |
| 已准备，仍需真实环境验证 | 有权限控制的 Cloud Admin 增删改、照片网页图上传、Storage 策略、相应的发布与恢复流程。 |
| 尚未实现或完成 | 本地 Admin 跨设备同步；对现有原片的访问保护；云端新照片的独立静态分享页和下载按钮；完整的图片、Auth 与数据库备份及恢复；真实访客性能监控；自定义域名、站内搜索、多语言与其他长期功能。 |

截至本说明编写时，当前 Git 分支是 `feature/roadmap-completion`，而公开 GitHub Pages 的最新部署不应被视为已经包含本分支所有功能。合并发布前，下载、分享页和 Cloud Admin 的状态以本地仓库及相应检查记录为准。项目的后续顺序见 [`roadmap.md`](roadmap.md)；代码学习说明见 [`README.md`](../README.md)。
