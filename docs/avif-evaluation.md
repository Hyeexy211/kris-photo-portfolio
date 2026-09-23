# AVIF 评估（2026-09-23）

## 现有用法

首页 Hero 和九张已发布照片使用真实的 640、1200、1800 宽 WebP。照片数据中的 `src`、`srcset`、`fullSrc`，以及独立照片页的网页尺寸下载，都依赖这些 WebP 路径。本次只做格式评估；网站图片和引用没有改动。

## 两张照片的本地样本

从仓库内原始 JPEG 各生成一张 1200 宽的临时 AVIF，使用本机 FFmpeg 9.0.1 的 `libsvtav1`、CRF 30、preset 8、10-bit YUV 4:2:0。与当前同尺寸的 WebP 文件比较：

| 照片 | 尺寸 | 当前 WebP | 临时 AVIF | 文件体积减少 |
| --- | --- | ---: | ---: | ---: |
| `portrait-01` | 1200 × 1800 | 237,924 B | 107,378 B | 54.9% |
| `landscape-03` | 1200 × 600 | 208,400 B | 152,644 B | 26.8% |

生成命令（输出仅在 `/tmp`）：

```bash
ffmpeg -hide_banner -loglevel error -i images/portrait/portrait-01.jpg -vf 'scale=1200:-2' -frames:v 1 -c:v libsvtav1 -crf 30 -preset 8 -pix_fmt yuv420p10le /tmp/kris-portrait-01-avif-test.avif
ffmpeg -hide_banner -loglevel error -i images/landscape/landscape-03.jpg -vf 'scale=1200:-2' -frames:v 1 -c:v libsvtav1 -crf 30 -preset 8 -pix_fmt yuv420p10le /tmp/kris-landscape-03-avif-test.avif
```

`sips` 对两个 AVIF 都显示 sRGB；本次没有单独确认它们是否内嵌 ICC。Playwright 在本机 Chromium 153.0.8010.12 中对四张样本调用 `HTMLImageElement.decode()`：两张 AVIF 和两张现有 WebP 均成功，解码后的自然尺寸与表格一致，无页面脚本错误。在浏览器并排预览中，缩小显示时未见明显破图；这不能代替逐张、原尺寸的画质检查。

两种格式的编码参数并不相同，现有 WebP 的编码设置未在本次重建。因此，体积差异不能当作相同主观画质下的压缩率结论。样本也未覆盖九张照片、Hero、其他浏览器或移动设备。

## 决定

暂不把网站切换到 AVIF。当前 WebP 已覆盖响应式尺寸，并通过本地页面与下载检查；AVIF 仍有可测的节省空间。若未来要发布 AVIF，应先对完整照片集做同画质目标的逐张对照，并在目标浏览器和移动设备测试加载、色彩与性能。页面需要保留 WebP 作为后备来源，例如用 `<picture>` 的 AVIF `<source>` 配合现有 WebP `<img>`；动态相册、项目页、独立照片页和元数据路径也要同步检查。网页尺寸下载继续提供 1200 宽 WebP，符合当前访客下载决定。

参考：[MDN 图片格式指南](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)（AVIF、WebP 与格式后备）；[web.dev 图片格式选择指南](https://web.dev/articles/choose-the-right-image-format)。
