<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 菜单维护

- 本应用的 Shell 一级入口由 `web-shell/src/shell/sitemap.yaml` 配置，二级菜单来自本应用的 `menus.yaml`。三种方式和支持状态见 [菜单配置指南](../../web-shell/docs/menu-configuration.md)。
- 应用菜单或页面变更后，需重新打包、安装到 Shell 并装配；独立运行使用本应用 `/api/menus`。
