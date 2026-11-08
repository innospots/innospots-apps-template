<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 菜单维护

- 配置菜单或修改导航逻辑前阅读 [菜单配置指南](docs/menu-configuration.md)。Shell 一级入口和应用一级分组已支持，Shell 配置全部菜单仍待实现；不要把设计示意写成已支持的配置。
- 修改后核对装配、菜单引用、当前路径匹配与布局；模块菜单修改需先重打包并重新安装。
