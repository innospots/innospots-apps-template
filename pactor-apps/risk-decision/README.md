# 风险决策 · 总览

从 `nextjs-version` 拆出的独立工程，保留「风险决策 / 总览」（根路径 `/`）、
「对接日志」（`/integration-logs`）与「指标说明」（`/guide`），登录、集成对接、
策略沙盘、风险决策等其他模块均已移除。应用外壳自带左侧二级菜单；
接入 Shell 后外层再套 60px 一级图标轨。

## 运行

```bash
pnpm install
pnpm dev        # http://localhost:8022
```

生产构建：

```bash
pnpm build
pnpm start      # http://localhost:8022
```

## 结构

| 路径 | 说明 |
| --- | --- |
| `app/layout.tsx` | 根布局，挂载 `PactorApp`（跨路由常驻） |
| `app/api/sitemap/route.ts` | 下发内联了布局 / 页面 DSL 的 sitemap |
| `app/api/menus/route.ts` | 下发应用菜单（读取 `src/server/yaml/menus.yaml`） |
| `src/server/menus.ts` | 菜单接口数据源（后续可替换为数据库 / 权限服务） |
| `src/server/yaml/` | sitemap、menus 与页面 YAML DSL |
| `src/pactor/components/` | 外壳与页面样式 |

菜单由 `src/server/yaml/menus.yaml` 维护，经 `/api/menus` 下发；`src/pactor/config.ts` 的
`sitemapSources` 将 `/api/sitemap` 与 `/api/menus` 多源合并，布局 DSL 通过
`${data.session.menus}` 渲染应用二级菜单。

页面由 Pactor server-driven UI 渲染：`src/server/yaml/risk-decision/` 下的
总览页与对接日志页与源工程保持一致，仅移除了依赖宿主应用的 `risk.enterPage`
生命周期。
