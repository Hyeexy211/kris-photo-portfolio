# 旧内容清点与清空记录（2026-09-23）

## 清空前的云端清单

2026-09-23 13:12 UTC 从当前 Supabase 公开只读 API 导出：3 个作品集、9 张照片。备份保存在非公开目录：

`/Users/hyeexy/Documents/KrisPortfolioBackups/2026-09-23/kris-public-content-20260923T131221Z.json`

备份文件权限为 `0600`；已重新读取 JSON，确认 `format=kris-public-content-v1`、3 个作品集、9 张照片。SHA-256：`496ac0b41b9c577fda0eaa81e69646cfc9cb1d5fc5d0ef190547a095ed66ec36`。这份备份包含公开数据库字段，不包含图片文件或 Storage 对象。项目的原图、网页图及云端图片对象均保留，不纳入删除范围。

| 作品集 ID | 当时的 slug | 当时的类别 | 封面引用 | 关联照片 ID |
| --- | --- | --- | --- | --- |
| `documentary` | `documentary` | `documentary` | `images/documentary/documentary-01-1200.webp` | `documentary-001`、`documentary-002`、`documentary-003` |
| `landscape` | `landscape` | `landscape` | `images/landscape/landscape-01-1200.webp` | `landscape-001`、`landscape-002`、`landscape-003` |
| `portrait` | `coffee` | `coffeeshop` | `images/portrait/portrait-01-1200.webp` | `portrait-001`、`portrait-002`、`portrait-003` |

`portrait` 的云端 slug 与类别已经不同于仓库历史种子。不能用旧种子替代本次备份。

| 照片 ID | 所属作品集 | 当时的类别 | 1200 像素网页图引用 | 1800 像素大图引用 |
| --- | --- | --- | --- | --- |
| `documentary-001` | `documentary` | `documentary` | `images/documentary/documentary-01-1200.webp` | `images/documentary/documentary-01-1800.webp` |
| `documentary-002` | `documentary` | `documentary` | `images/documentary/documentary-02-1200.webp` | `images/documentary/documentary-02-1800.webp` |
| `documentary-003` | `documentary` | `documentary` | `images/documentary/documentary-03-1200.webp` | `images/documentary/documentary-03-1800.webp` |
| `landscape-001` | `landscape` | `landscape` | `images/landscape/landscape-01-1200.webp` | `images/landscape/landscape-01-1800.webp` |
| `landscape-002` | `landscape` | `landscape` | `images/landscape/landscape-02-1200.webp` | `images/landscape/landscape-02-1800.webp` |
| `landscape-003` | `landscape` | `landscape` | `images/landscape/landscape-03-1200.webp` | `images/landscape/landscape-03-1800.webp` |
| `portrait-001` | `portrait` | `portrait` | `images/portrait/portrait-01-1200.webp` | `images/portrait/portrait-01-1800.webp` |
| `portrait-002` | `portrait` | `portrait` | `images/portrait/portrait-02-1200.webp` | `images/portrait/portrait-02-1800.webp` |
| `portrait-003` | `portrait` | `portrait` | `images/portrait/portrait-03-1200.webp` | `images/portrait/portrait-03-1800.webp` |

每条照片的 640 像素引用与同一目录、编号的 `-640.webp` 对应。作品集封面的 640、1800 像素引用也遵循相同编号。完整字段与 `srcset` 以私有 JSON 备份为准。

其他已清点的展示入口：`index.html` 原固定 Hero 引用了 `images/hero/hero-01-{640,1200,1800}.webp`；旧 `projects/*.html` 有 3 页，旧 `photos/*.html` 有 9 页；旧 `sitemap.xml` 列出了这些固定页面。本次根目录源码已删除这些静态入口、旧种子和再播种脚本，Hero 改为零内容样式。`dist/` 托管副本和 GitHub Pages 是否已同步，须单独核查。旧图片文件本身不删除。

## 执行边界与状态

- 生产库已执行 `supabase/clear-legacy-content-20260923.sql`：仅删除清单中的 9 个照片 ID、3 个作品集 ID。SQL 在事务中核对各记录的备份时间戳，并检查是否有新照片关联到待删除作品集；状态变化时回滚，不执行全表清空。紧随该次删除的生产库计数为 **0 个作品集、0 张照片**，清空前为 **3 个作品集、9 张照片**。
- 生产库随后已执行 `supabase/migrations/20260923_shared_categories.sql`。它建立作品集与照片共用的类别定义；回退步骤见 `docs/shared-categories-migration.md`。
- 本文的首次 0/0 是限定清空完成时的生产库结果；下面的最终计数是在临时 QA 内容清理后重新取得，两次读数对应不同时间点。
- 备份图片若仍位于公开 Git 仓库或公开托管目录，知道原 URL 的人可能继续直接访问。页面不再展示旧图与旧文件不可访问是两件事。

## 本轮 Cloud Admin 验收与测试清理

在当前源码的 HTTP 预览中，所有者连接真实 Supabase 验证了作品集区一次选择多张照片、逐张资料保存、共用类别创建／重命名／合并、批量类别与归属修改、跨作品集移动、集内排序、批量删除，以及公开作品集与 Gallery 展示。部分失败后的失败项重试只通过 mock 模拟验证，尚无真实网络或数据库故障下的完整清理验收；第二个已登录非管理员账号也未测试。

验收后删除了 **2 个临时作品集、2 张临时照片、1 个临时类别**以及 **12 个本轮测试 WebP**。Storage 中另有 4 个由界面自动生成的零字节 `.emptyFolderPlaceholder` 占位对象；确认它们不是网页图后，已逐层删除占位对象及空目录。最终生产库只读 SQL 复核为：

| 位置 | 最终数量 |
| --- | ---: |
| `public.collections` | 0 |
| `public.photos` | 0 |
| `public.categories` | 0 |
| `portfolio-web` Storage 对象 | 0 |
| `portfolio-originals` Storage 对象 | 0 |

Storage 页面同时显示 `portfolio-web` 桶根为空。此次清理的是本轮临时测试导出和自动占位对象；仓库内旧原图、网页图与公开图片路径未删除或移动。根目录源码、`dist/`、GitHub Pages 和生产数据库仍是不同状态，发布与线上核查须依据实际构建状态单独报告。

## 后续只读复核（2026-09-27）

公开只读 API 再次返回 `collections=0`、`photos=0`、`categories=4`。这 4 个类别（`portrait`、`street`、`landscape`、`cafe`）的 `created_at` 均为 2026-09-23 14:13:41 UTC，晚于本轮测试清理时的零计数；它们不在旧内容或临时 QA 删除清单中，因此保留。上述 Storage 的 `0/0` 是 2026-09-23 清理后的实测值，不能据此推断 2026-09-27 的 Storage 对象数量。
