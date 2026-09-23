# 作品集与 Gallery 增删改查实测记录

测试日期：2026-09-23。测试对象是当前工作区源码，通过 `http://127.0.0.1:4173` 访问。本文保留首次测试的问题记录，并补充当天修复后的真实云端复测。本次已执行内容数据库迁移；没有 Git 提交、推送或静态网站部署。

## 结论

浏览器本地模式的 12 组使用场景通过。首次真实云端测试发现的缺失字段、删除外键及竖图尺寸限制已修复；修复后通过 Cloud Admin 表单完成了作品集和 Gallery 的新增、读取、编辑、真实图片上传与替换、归属编排、排序和删除。所有临时记录及 15 个测试图片对象均已清理，原始 3 个作品集、9 张照片的全部字段和时间戳与迁移后的测试前快照完全一致。迁移前后既有字段的数据库哈希也保持不变。

`portfolio-web` 与所需 Storage 策略原本已存在。首次 `getBucket()` 返回 `Bucket not found` 是不能据以判断桶缺失的权限探测结果；后续通过控制台核查、成功上传和删除确认实际配置可用，没有为探测接口扩大权限。非管理员第二账号未提供，因此该账号的实际登录与写入拒绝仍未测试；匿名写入拒绝已验证。

## 本地完整 UI 测试

使用隔离的可见 Chromium context，访问 `admin.html?mode=local`；测试路由只在该 context 内把公开页数据源设为 local。没有更改仓库数据源配置或用户 Chrome 的本地内容。

用户授权的 `Pictures/After_low/胶片外框/20260629福予咖啡1.jpg` 和 `20260629福予咖啡2.jpg` 被复制到临时测试目录并通过测试图片路由展示。原 JPG 未改动，原图与副本 SHA-256 一致；测试没有把它们上传到云端。

| 操作 | 实测结果 |
| --- | --- |
| Collection 新增、读取、编辑、换封面、简介与多段故事、刷新保留 | 通过 |
| Photo 新增、读取、编辑、换图片路径、资料保存及清空 | 通过 |
| 批量加入、跨作品集移动的取消及确认 | 通过 |
| 集内排序及 Gallery 全局顺序独立 | 通过 |
| 公开作品集的封面、故事、照片与顺序 | 通过，真实测试图片正常加载 |
| Gallery 全部与分类查询、合并分类、灯箱资料 | 通过，11 张总记录、2 张临时分类，无重复 |
| 移出作品集后 Photo 继续留在 Gallery | 通过 |
| 删除 Collection 的取消及确认，关联 Photo 保留并解除关联 | 通过 |
| 删除 Photo 的取消及确认，刷新公开页同步 | 通过 |
| 手机 Admin 布局 | 390 px 无横向溢出 |
| 脚本异常 | 未捕获到浏览器 pageerror |
| 清理和复原 | UI 删除全部临时记录；规范化数据深比较一致；原始 localStorage 字符串逐键一致 |

详细脚本、截图、前后快照和结构化结果位于本机临时目录 `/tmp/kris-crud-20260923-local/`。该目录会受系统临时文件清理影响。

## 首次真实 Supabase 测试（修复前）

用户在 Chrome 自行登录所有者账号。当前会话的 `is_portfolio_admin()` 返回 `true`，后台读取到真实云端 3 个 Collection 和 9 个 Photo。未导出账号密码或会话凭据。

为验证实际数据库与 UI，不修改正式记录，使用旧表结构支持的字段直接插入 1 个临时 Collection 和 2 个临时 Photo，并复用已公开的图片路径。此步骤证明的是真实数据库新增权限，不代表当前 Admin 上传新增表单已经通过。测试 ID 为 `qa-crud-20260923-collection`、`qa-crud-20260923-photo-a`、`qa-crud-20260923-photo-b`，结束时均已删除。

| 操作 | 实测结果与边界 |
| --- | --- |
| 所有者登录、管理员身份、云端读取 | 通过 |
| 旧字段临时记录数据库新增 | 通过，后台刷新看到 4 个作品集、11 张照片；未经过上传新增表单 |
| 公开 Gallery 与作品集读取临时云端记录 | 通过；全部 11 张，临时分类 2 张，详情页 2 张；临时记录未存在于本地存储 |
| 通过 Admin 批量重命名临时分类 | 通过；2 张 Photo 更新成功，公开页新分类生效、旧分类消失 |
| 通过 Admin 编辑作品集 | 被阻挡：`collections.story` 缺失；表单明确提示迁移，数据库记录未被改写 |
| 通过 Admin 编辑 Photo | 被阻挡：`photos.capture_time` 缺失；表单明确提示迁移，数据库记录未被改写 |
| 通过 Admin 移出作品集 | 被阻挡：`photos.collection_order` 缺失；界面正确报告已保存 0 项，并重新读取实际归属 |
| 删除含 2 张 Photo 的临时 Collection | 取消时保留记录；确认后旧外键 `photos_collection_id_fkey` 阻止删除，提示需要迁移；Collection 与两张 Photo 均保留 |
| 删除临时 Photo | 取消时保留记录，确认后成功删除；两张临时 Photo 均经 UI 清理 |
| 删除清空后的临时 Collection | 通过，临时 Collection 经 UI 删除 |
| Storage 查询 | 当前账号 `getBucket('portfolio-web')` 返回 `Bucket not found`；该结果不能证明桶不存在，后续已纠正判断 |
| 真正图片上传、换图和上传对象恢复 | 首轮未完成；Chrome 文件选择扩展权限未启用，尚未通过实际上传验证 Storage。该轮未成功上传任何图片对象 |

## 首轮数据复原证明

测试前读取并保留了 `collections` 与 `photos` 的原始数据库 rows，按 `id` 排序。所有操作仅涉及本轮临时记录。UI 清理后重新查询，逐条逐字段比较原始 rows（含 `created_at` 与 `updated_at`）：

```text
worksCount: 3
photosCount: 9
worksExactlyEqual: true
photosExactlyEqual: true
queryErrors: [null, null]
```

最后刷新公开首页与后台：3 个作品集、9 张照片；临时分类按钮为 0；不存在临时测试记录或表单草稿。未成功上传 Storage 对象，因此没有本次上传对象需要清理。未改动源图片文件或正式内容。

## 已完成的修复

1. 用户登录 Supabase 控制台后，先核查现有字段、外键、触发器、桶、策略和原始数据哈希，再事务执行 `supabase/migrations/20260923_collection_content.sql`：新增 `collections.story`、`photos.collection_order`、`photos.capture_time`；按原顺序初始化集内顺序；允许解除归属；外键改为 `ON UPDATE CASCADE ON DELETE SET NULL`；最后通知 PostgREST 刷新结构缓存。
2. 没有重新执行 schema、seed、身份或 Storage 迁移。已有公开网页桶、私有原图桶及四条对象策略符合要求。网站所有者权限不等同于读取桶管理信息的权限，因此不再使用 `getBucket()` 单独判定上传是否可用。
3. `js/cloud-photo-upload.js` 将图片要求改为最长边至少 1800 px，并按最长边 640／1200／1800 导出，保留比例、不放大。对象文件名使用尺寸档位，`srcset` 与数据库宽高使用真实像素。Admin、中英文提示及尺寸文档同步更新。
4. 用户自行开启 Chrome 扩展的文件网址访问权限后，原生文件选择成功。源 JPEG 只在浏览器本地读取，实际上传三档 WebP；没有上传源 JPEG 或修改源文件。

## 修复后的真实云端 UI 复测

临时作品集 ID：`a9b0bdcc-863d-4637-9c78-e735bf3bc898`；临时 Photo ID：`7efc8995-9f60-46a2-9832-0bf6aa648d23`、`4589b26d-f740-4fc1-a703-e8f03e8a585f`。图片来自用户授权目录的两张咖啡竖图。所有增删改和归属操作通过 Cloud Admin UI 执行；原始 rows 核验与测试对象清理使用已登录 SDK，最终哈希与对象总量用控制台只读 SQL 核查。

| 场景 | 结果 |
| --- | --- |
| 新增作品集并上传 1080 × 1920 竖图封面 | 通过，三档上传完成，公开页可读 |
| 新增两张 Gallery 照片，一张初始关联、一张未关联 | 通过，总数变为 11，无重复 |
| 编辑作品集标题、多段故事并替换封面 | 通过，新版本 URL 生效，旧版本按产品设计保留 |
| 编辑 Photo 标题并替换图片 | 通过，新版本 URL、真实宽高正确 |
| 拍摄资料保存与清空 | 临时日期 `2000-01-01`、时刻 `12:34:56` 保存成功；随后清空成功。该日期明确标注为测试值，未用作正式拍摄资料 |
| 加入已有照片、保存集内排序 | 通过，集内顺序调换为 2／1；Gallery 全局顺序仍为 900／901 |
| 移出作品集 | 通过，Photo 保留，`collectionId` 和 `collectionOrder` 清空 |
| 临时分类批量重命名 | 通过，两张 Photo 更新，公开筛选返回 2 张 |
| 公开作品集 | 更新后的封面、标题、两段故事及剩余关联照片正常读取和加载 |
| 删除仍含 1 张 Photo 的作品集 | 取消时保留；确认后作品集删除，关联 Photo 保留，`collectionId` 自动设为 null |
| 删除两张临时 Photo | 通过，公开页恢复 9 张 |
| 匿名数据库新增 | 拒绝，PostgreSQL `42501`／permission denied |
| 匿名 Storage 上传 | 拒绝，403／row-level security policy |
| 本次正常页面控制台 | 公开页和 Admin 查询到的 error／warn 日志均为空；匿名负向测试的 API 错误已单独核验 |

真实云端 WebP 下载后在浏览器内再次解码，得到 360 × 640、675 × 1200、1013 × 1800；MIME 为 `image/webp`，大小分别为 12,354、29,314、47,626 bytes，均无 EXIF/XMP。`srcset` 使用 360w、675w、1013w，数据库展示宽高为 675 × 1200。独立本地导出测试还验证了横图三档输出、九份 WebP 元数据检查及过小图片拒绝，结果见 `/tmp/kris-long-edge-upload-results.json`。

## 最终复原与交付状态

清理顺序为：通过 UI 删除临时内容记录；枚举上述三个临时 ID 的 Storage 版本目录；确认现有数据库记录不再引用这些路径；调用对象删除接口清除全部 15 个 WebP（包括替换前的版本）；重新列表与控制台核查。

```text
collections: 3
photos: 9
worksExactlyEqualToPostMigrationBaseline: true
photosExactlyEqualToPostMigrationBaseline: true
queryErrors: [null, null]
temporaryCategoryButtons: 0
removedTestWebPObjects: 15
remainingTestObjects: 0
portfolioWebAndOriginalsObjectCount: 0
collectionsExistingFieldsMD5: 78ee9317dc1fad5dfb2f210590d55a87
photosExistingFieldsMD5: 79813a0f2250393252dfcc4787a1a82f
```

最后两项哈希排除本次新增列，包含既有内容和时间戳，与迁移前完全一致。新增列和外键修复保留；正式拍摄日期、时刻没有编造。匿名测试记录与对象未创建成功，其临时路径再次检查为空。

13 个修改或新增的 JavaScript 文件通过 `node --check`；`git diff --check` 通过；38 个活跃 HTML、CSS、JS、locales、data 文件与 `dist/` 逐字节一致。未提交、推送或部署静态网站。正常产品行为仍是换图或删记录后保留旧 Storage 文件供人工检查，本次临时测试对象另已全部清理。

本次完成了上述 CRUD 与图片上传复测，并非全部生产验收用例。第二个真实非管理员账号、其余 Storage 拒绝场景、真实网络或数据库故障下的自动清理，以及尚未部署的静态代码在发布环境中的复测仍未完成；完整范围见 `supabase-admin-setup.md` 和 `supabase-storage-setup.md`。
