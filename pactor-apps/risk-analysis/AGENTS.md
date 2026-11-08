<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 菜单维护

- 本应用的 `menus.yaml` 使用 `root: true` 分组提供 Shell 一级菜单；独立运行时同一文件经应用 `/api/menus` 加载。配置方式与限制见 [菜单配置指南](../../web-shell/docs/menu-configuration.md)。
- 新增菜单页面时同步注册 sitemap 的 `pages` 和 DSL；接入 Shell 后需重打包、安装和装配。
