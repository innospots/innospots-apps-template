# InnoSpots Apps Template

基于 **Next.js + Pactor** 的多业务前端模板仓库：一个统一宿主 `web-shell` + 多个可独立开发、以 npm 包交付的业务模块 `pactor-apps/*`。

- **构建期装配**：Shell 在构建前扫描已安装的模块包，生成路由、菜单、页面索引与注册表；
- **运行期渲染**：页面由 Pactor 的 YAML DSL 描述，`PactorHost` 通过 `/api/runtime/*` 加载页面、片段与布局；
- **模块交付物**：模块工程产出 `dist-module/`（Manifest V1 + DSL + client bundle + assets + 可选 server bundle），打包为 tgz 后由 Shell 以 `file:` 依赖安装。

更完整的架构、模块契约与排查手册见 [`web-shell/README.md`](web-shell/README.md)。

## 目录结构

```text
innospots-apps-template/
├── web-shell/                       # 统一 Web Shell（Next.js 宿主，端口 9020）
│   ├── app/
│   │   ├── (workspace)/[...slug]/   # 工作区页面入口（所有模块页面在此渲染）
│   │   └── api/
│   │       ├── runtime/             # bootstrap / pages / fragments 运行时接口
│   │       └── modules/[moduleId]/  # 模块服务端 API 统一分发（/api/modules/<id>/*）
│   ├── src/
│   │   ├── shell/                   # Shell 自带站点（sitemap.yaml、shell.layout.yaml）
│   │   ├── modules/                 # module-list.json、注册表、路由解析、模块类型
│   │   ├── runtime/                 # PactorHost、扩展注册、Pactor 适配器
│   │   └── server/                  # bootstrap / pages / fragments / 模块 API 分发
│   ├── scripts/                     # assemble / validate / smoke 装配脚本
│   ├── docs/                        # 模块接入与适配设计文档
│   ├── .generated/pactor/           # 装配产物（生成物，勿手改）
│   └── public/modules/              # 模块静态资源 <moduleId>/<version>/
└── pactor-apps/
    ├── risk-analysis/               # 风险分析（端口 8021，含 server entry 示例）
    └── risk-decision/               # 风险决策（端口 8022，纯 DSL 模块示例）
```

每个业务模块工程结构一致：

```text
pactor-apps/<app>/
├── app/                           # 独立运行入口（PactorApp、sitemap API、可选业务 API）
├── module/                        # 模块接入面（由 pactor module init 生成）
│   ├── client.ts                  # 扩展注册表入口（components / actions）
│   ├── module.css                 # 模块自带样式（可选，由 client.ts import）
│   └── server.ts                  # 模块服务端 API（可选，--server 生成）
├── src/
│   ├── server/yaml/               # sitemap 与页面 DSL
│   ├── pactor/                    # PactorApp 配置、自定义组件与样式
│   └── server/api/                # 业务数据实现（独立运行与 server entry 共用）
├── pactor.module.json             # 模块打包配置
├── dist-module/                   # pactor module build 产物
└── <name>-<version>.tgz           # pactor module pack 产物（Shell 以 file: 安装）
```

## 环境要求

- Node.js 20+
- pnpm（各子工程独立安装依赖，仓库根目录没有 workspace 配置）
- Pactor CLI（构建 / 打包模块需要）：`npm install -g @pactor-app/cli`（Node.js >= 18）

## 快速开始

### 启动 Shell

```bash
cd web-shell
pnpm install
pnpm assemble:modules   # 读取已安装的模块包，生成 .generated/ 与 public/modules/
pnpm dev                # http://localhost:9020
```

生产构建与启动：

```bash
pnpm build   # assemble:modules → validate:modules → next build
pnpm start   # http://localhost:9020
```

### 独立运行某个业务模块

```bash
cd pactor-apps/risk-analysis
pnpm install
pnpm dev      # http://localhost:8021
```

`risk-decision` 同理，端口 8022。独立运行时页面与 API 都在本工程内；打包进 Shell 后由 Shell 统一承接。

当前默认页面：

| 模块 | 公开路径 | 说明 |
| --- | --- | --- |
| risk-analysis | `/pactor-app-risk-analysis` | 风险数据取值页，含 `/api/risk-analysis/*` 服务端 API |
| risk-decision | `/pactor-app-risk-decision` | 风险决策页；`/pactor-app-risk-decision/integration-logs` 为隐藏路由 |

## 模块开发与接入流程

1. **准备模块工程**
   可复制 `pactor-apps/risk-decision` 作为模板，或使用 `pactor create <name>` 生成基础工程。

2. **初始化模块接入面**（在模块工程根目录执行）
   ```bash
   pactor module init            # 生成 pactor.module.json、module/client.ts、module/module.css
   pactor module init --server   # 额外生成 module/server.ts，并写入 serverEntry / apiPrefixes
   ```
   - 已存在的文件默认跳过；`--force` 覆盖（终端会先确认）。
   - 纯 DSL 模块不需要 `--server`；启用服务端 API 时使用它。

3. **确认 `pactor.module.json`**
   | 字段 | 说明 |
   | --- | --- |
   | `id` | 模块唯一 id（`pactor-app-` 前缀），参与 URL 与 globalPageId |
   | `basePath` | 页面挂载前缀，如 `/pactor-app-risk-analysis` |
   | `yamlRoot` | DSL 根目录，默认 `src/server/yaml` |
   | `clientEntry` | client bundle 入口，默认 `module/client.ts` |
   | `serverEntry` / `apiPrefixes` | 可选，必须成对出现；启用后 `target` 需为 `innospots-web-shell@3` |
   | `target` | 宿主契约版本，默认 `innospots-web-shell@3` |

4. **构建与打包**
   ```bash
   pnpm build:module   # 生成 dist-module/
   pnpm pack:module    # 默认递增 patch 版本 + 构建 + npm pack，生成 tgz
   ```
   `pack` 每次都会递增版本号，产生新的 `<name>-<version>.tgz`。

5. **在 Shell 中安装模块包**
   ```bash
   cd web-shell
   pnpm add ../pactor-apps/risk-analysis/risk-analysis-0.1.3.tgz
   ```
   请使用模块工程当前实际生成的 tgz 文件名。

6. **启用模块**（`web-shell/src/modules/module-list.json`）
   ```json
   {
     "modules": [
       { "package": "risk-analysis", "enabled": true, "menuMode": "hidden", "access": "public" }
     ]
   }
   ```
   - `enabled`：是否参与装配；
   - `menuMode`：`merge`（默认，模块菜单并入 Shell 导航）或 `hidden`（注册为隐藏路由，使用 Shell 默认布局）；
   - `access`：`public` 时为未声明访问级别的页面 / 菜单补 `public`。

7. **重新装配并启动**
   ```bash
   pnpm assemble:modules
   pnpm validate:modules
   pnpm dev
   ```

> Shell 的一级菜单在 `web-shell/src/shell/sitemap.yaml` 中维护，通过 `<moduleId>:<pageId>` 指向模块页面；`menuMode: "hidden"` 的模块只补充隐藏路由，不会重复出现在导航中。

## 常用命令

| 位置 | 命令 | 作用 |
| --- | --- | --- |
| web-shell | `pnpm dev` | 启动开发服务器（9020） |
| web-shell | `pnpm assemble:modules` | 装配模块，写入 `.generated/pactor` 与 `public/modules` |
| web-shell | `pnpm validate:modules` | 校验路由 / pageId / 菜单引用 / 模块 API 前缀 |
| web-shell | `pnpm smoke:module-api` | 对已启动的 Shell 冒烟 `/api/modules/*` |
| web-shell | `pnpm build` / `pnpm start` | 生产构建（含装配与校验）/ 启动 |
| web-shell | `pnpm lint` | ESLint 检查 |
| pactor-apps/* | `pnpm dev` / `pnpm build` / `pnpm start` | 独立开发 / 构建 / 启动 |
| pactor-apps/* | `pnpm typecheck` | TypeScript 类型检查 |
| pactor-apps/* | `pnpm build:module` | 构建 `dist-module/` |
| pactor-apps/* | `pnpm pack:module` | 递增版本 + 构建 + 生成 tgz |
| pactor-apps/* | `pnpm publish:module` | pack + `npm publish` |

也可以直接调用 CLI：`pactor module build|validate|pack|publish --dir <工程根>`。

## 关键产物与路径

| 路径 | 内容 |
| --- | --- |
| `<module>/dist-module/` | `manifest.json`、`module-assets.json`、`dsl/`、`client/`、`assets/`、可选 `server/index.mjs` |
| `<module>/<name>-<version>.tgz` | Shell 通过 `file:` 安装的模块包 |
| `web-shell/.generated/pactor/` | 装配索引与注册表（routes / menus / pages / client-registry 等） |
| `web-shell/public/modules/<moduleId>/<version>/` | 模块 DSL 与静态资源，浏览器经 `/modules/...` 访问 |
| `web-shell/src/shell/sitemap.yaml` | Shell 固定菜单、布局与默认页面配置 |
| `web-shell/src/modules/module-list.json` | 模块启停、菜单接入模式与默认访问级别 |

模块样式写在 `module/module.css`（通过 `module/client.ts` import），构建时抽取为 `dist-module/client/index.css` 并写入 manifest 的 `styles`，由 Shell 自动加载。Tailwind 基础样式、主题变量与 reset 由 Shell 统一提供，模块内不要重复引入。

## 文档

- [`web-shell/README.md`](web-shell/README.md)：Shell 架构、模块契约、装配流程、产物与排查（推荐先读）
- [`web-shell/docs/`](web-shell/docs/)：模块化接入与适配设计方案
- [`pactor-apps/risk-analysis/README.md`](pactor-apps/risk-analysis/README.md)：含服务端 API 的模块示例
- [`pactor-apps/risk-decision/README.md`](pactor-apps/risk-decision/README.md)：纯 DSL 模块示例

## 注意事项

- 修改模块源码后，必须重新 `build:module` → `pack:module`，在 Shell 中安装新 tgz，再执行 `assemble:modules`；Shell 不会热加载模块源码。
- `.generated/pactor/` 与 `public/modules/` 是装配生成物，不要手工修改。
- 启用 server entry 必须同时配置 `serverEntry` 与 `apiPrefixes`，`package.json` 需导出 `./server`（`pactor module init --server` 会自动注入），且 `target` 为 `innospots-web-shell@3`。
- 当前示例模块为 `risk-analysis` 0.1.3（含 server entry）与 `risk-decision` 0.1.3；版本以各 `package.json` 与 `module-list.json` 实际配置为准。
