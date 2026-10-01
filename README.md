# PENGYANG.DESIGN

个人设计作品集，使用 React、Vite、Three.js 和 Lenis 构建。

## 本地运行

使用 Node.js 22 或更高版本：

```bash
npm ci
npm run dev
```

本地生产预览：`npm run build`，然后 `npm run preview`。

## GitHub Pages

线上地址：https://yui121244.github.io/portfolio/

仓库 Settings → Pages → Source 选择 **GitHub Actions**。
每次推送 `main`，自动安装锁定版本的依赖、构建并发布。

`npm run build:pages` 将发布文件生成至 `dist-pages/`，使用 `/portfolio/` 资源路径。
构建同时生成五个项目入口，保证 `/portfolio/projects/1/` 至 `/portfolio/projects/5/` 可直接访问和刷新。
本地默认构建仍使用根路径，保持原有预览地址可用。

## 更新资源

- 首页封面：`assets/images/01.webp` 至 `05.webp`。
- 头像：`assets/images/portrait-pengyang.webp`；简历：`assets/images/简历.jpg`。
- 项目详情：`assets/project/1` 至 `5`，按文件名数字顺序读取图片和视频。
- 演示文档：`assets/ppt/*.pdf`，自动同步文件名与数量。
- 锚点和项目文案：`src/data/projects.js`。

替换素材后提交并推送到 `main`，等待 Actions 发布成功即可。
不提交 `node_modules`、构建产物、测试浏览器目录、Cookie、缓存或环境凭据。
