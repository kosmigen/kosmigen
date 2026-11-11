# kosmigen · Astro

```sh
npm ci
npm run dev
```

打开 [本地首页](http://127.0.0.1:4321/kosmigen/)。用 `npm run build` 生成 `dist/`，再用 `npm run preview` 预览正式构建。Astro 7.4.10 需要 Node.js 22.23.4 或更高版本。

## 日常写作

- **技术文档**放在 `content/notes/`。目录和文件名决定网址，`index.md` 是所在目录的入口。新文档会出现在技术文档首页的「新增文档」里。
- **博客**放在 `content/blog/posts/` 的任意子目录。使用 `date: YYYY-MM-DD`、可选的 `slug` 和 `categories`，用一级标题作为文章标题。用 `<!-- more -->` 标记摘要边界，用 `draft: true` 隐藏草稿。博客列表、归档和标签随文章更新。
- **Now** 在 `content/now/` 下按日期添加文件，例如 `2026/2026-11-11.md`。入口页自动展示最新一篇，旧记录仍有各自的网址。
- **项目**在 `content/projects/index.md` 的 `projects` 字段编辑，展示由 `src/components/ProjectCard.astro` 负责。作者与网站介绍分别在 `content/about/` 下。
- 站内 Markdown 链接可指向源文件，例如 `[Java 基础](syntax.md)`。构建时会改写为站内网址。新增或修改的正文也会进入搜索索引。

## 修改界面

通用页面外壳在 `src/layouts/SiteLayout.astro`，博客、Now 和项目卡片分别由 `src/components/` 中的 Astro 组件处理。样式、图片和浏览器脚本在 `public/assets/`。站点使用 `/kosmigen/` 前缀。

为了让迁移前后的页面保持一致，原 Markdown 和对应组件未变动时复用导入的页面片段。修改 Markdown 或组件后，Astro 会重新生成受影响的页面。已有导航树和页脚仍复用导入片段，新增文档先通过文档首页进入。修改过的正文使用 Astro 的 Markdown 语法，MkDocs 专有扩展可能需要转换。

```sh
npm run build
npm run check:site
```

如需验证初始迁移的页面和资源，可运行 `npm run check:site -- /path/to/reference/site`。

## GitHub Pages

在仓库 Settings → Pages 的 Source 选择 GitHub Actions。推送到 `main` 后，工作流会构建并部署到 [网站首页](https://kosmigen.github.io/kosmigen/)。

私人的新草稿先放在本地 `content/drafts/`，准备公开时再移动到正式栏目。公开仓库中的 `draft: true` 仅影响网页构建。
