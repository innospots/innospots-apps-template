# 菜单配置方式

本文区分菜单的维护位置与页面的归属。应用始终负责注册自己的页面和布局；菜单决定如何让用户找到页面。Shell 当前通过构建期装配模块，并由自己的 `/api/menus` 返回菜单，不会在点击菜单时请求应用独立服务。

| 方式 | Shell 一级 | Shell 二级 | 当前状态 |
| --- | --- | --- | --- |
| 1. Shell 配一级入口 | Shell `src/shell/sitemap.yaml` | 应用菜单，按模块归组 | 已支持，风险决策示例 |
| 2. 应用提供一级分组 | 应用 `menus.yaml` 中 `root: true` 的分组 | 该分组的 `children` | 已支持，风险分析示例 |
| 3. Shell 配全部菜单 | Shell | Shell | 设计方案，尚未完整支持，不能照示意配置上线 |

三种方式描述的是菜单所有权，并非 `menuMode` 的三个取值；现有 `menuMode` 只有 `merge` 和 `hidden`。同一个应用应选择一种清晰的 Shell 菜单来源，避免重复入口。不同应用可以采用不同的已支持方式。

## 前提：注册页面并启用模块

应用在 `src/server/yaml/sitemap.yaml` 的 `pages` 中注册页面，指定模块内 `id`、`path`、`title` 和 DSL 文件。例如风险分析的 `risk-data-value`。独立运行时使用本地页面 ID；Shell 中跨模块引用使用 `<moduleId>:<pageId>`，例如 `pactor-app-risk-analysis:risk-data-value`。Shell 的 URL 由模块 `basePath` 和页面 `path` 生成。

在 Shell 的 `src/modules/module-list.json` 中安装并启用模块。对于方式 1、2，设置 `menuMode: "merge"`；应用菜单打包后被装配并进入 Shell 菜单索引。`access: "public"` 是未声明访问级别时的默认值，不替代鉴权。

## 方式 1：一级入口由 Shell 配置

适合一个 Shell 一级入口对应一个应用菜单集合。当前 `risk-decision` 使用此方式。

在 `web-shell/src/shell/sitemap.yaml` 配置：

```yaml
menus:
  - id: app-risk-decision
    type: page
    pageId: "pactor-app-risk-decision:risk-decision"
    title: 风险决策
    icon: shield
    layout: risk-decision-admin
    root: true
    public: true
```

`root: true` 表示一级入口；`pageId` 是全局页面 ID，路径从页面索引继承；`layout` 应与目标应用页面使用的布局一致。应用的 `src/server/yaml/menus.yaml` 维护二级菜单，模块装配时添加 `moduleId`，Shell 按一级目标页所属模块取整组菜单。当前这个模式按模块分组，不能仅凭增加两个指向同一模块的叶子入口，就让它们显示不同二级菜单。

配置 Shell 后在 `web-shell` 下执行 `pnpm assemble:modules` 和 `pnpm validate:modules`。修改应用菜单或页面还需要先重新打包应用并安装新包。

## 方式 2：一级分组由应用配置

适合同一应用贡献多个 Shell 一级菜单，每个一级菜单显示自己的子菜单。当前 `risk-analysis` 使用此方式，在应用 `src/server/yaml/menus.yaml` 中配置：

```yaml
- id: workbench
  type: group
  title: 工作台
  icon: layout-dashboard
  root: true
  children:
    - id: operations-workbench
      type: page
      pageId: operations-workbench
      path: /workbench/operations
      title: 运营工作台
      layout: risk-analysis-admin
      public: true
    - id: task-workbench
      type: page
      pageId: task-workbench
      path: /workbench/tasks
      title: 任务工作台
      layout: risk-analysis-admin
      public: true
```

应用 sitemap 通过 `menus: { $include: menus.yaml }` 引入该文件，打包时展开；页面必须在 sitemap 的 `pages` 中注册。`root: true` 的 `type: group` 装配后成为 Shell 一级菜单，`children` 成为该一级菜单的二级菜单。Shell 从可见子菜单中选择第一个页面作为一级菜单的跳转目标，并根据当前路径匹配所属分组。当前示例的另一个分组是“分析”，包含“风险分析”和“分析说明”。

独立运行时，应用自己的 `/api/menus` 读取同一 `menus.yaml`，Pactor 合并 `/api/sitemap` 与 `/api/menus` 并按应用布局显示分组；无需 Shell 或 `root: true` 才能显示普通分组。Shell 的 `/api/menus` 则读取装配产物，不调用独立应用的菜单接口。修改应用菜单后，需要重新打包、在 Shell 安装新 tgz，再执行装配和校验。

## 方式 3：Shell 统一配置一级和二级菜单（待实现）

目标是由 Shell 维护全部菜单的顺序、标题、权限和页面引用；应用只提供页面、布局、扩展及 API。下面是**设计示意，不是当前受支持的配置契约**：

```yaml
# 设计示意：当前不要直接用于生产配置
menus:
  - id: workbench
    title: 工作台
    children:
      - id: operations
        title: 运营工作台
        moduleId: pactor-app-risk-analysis
        pageId: operations-workbench
```

实现前需要明确并开发：Shell 菜单 schema 和组与页面引用解析；跨模块子菜单的布局选择；禁止或去重应用菜单在 Shell 的自动合并；一级入口默认页、深链/刷新选中状态和隐藏路由；菜单及页面权限、缺失模块/页面的装配校验。当前 `moduleId` 加未限定 `pageId` 的写法不会自动解析为全局页面 ID，不能把示意直接粘贴使用；`menuMode: "hidden"` 也会隐藏应用菜单并移除其菜单级 layout，并不是完整的统一菜单管理开关。独立应用如仍需导航，应保留独立菜单来源。

## 运行时、权限和排查

Shell 装配生成 `.generated/pactor/menus.json`、`pages.json` 和 `routes.json`；`/api/menus` 过滤后返回原始 `menus` 和 `navigation`。`navigation.root` 是一级菜单；方式 1 使用 `navigation.modules[moduleId]`，方式 2 使用对应一级项的 `submenu` 和 `menuPaths`。`PactorHost` 按当前路径匹配一级项，向 `session.context` 提供 `rootMenus`、`activeRootKey` 和当前二级 `menus`。布局中的 `Menu` / `SitemapMenu` 的 `onSelect` 执行 `navigate`，页面 DSL 则由 runtime 接口加载。

`public`、`permission`、页面可见性和子项过滤共同影响菜单展示；当前会话解析是占位实现，返回匿名用户。菜单隐藏或过滤不能代替 DSL API 和业务 API 的服务端授权。

排查时依次检查：模块是否安装启用、`menuMode`、打包后的 sitemap、装配后的菜单/页面索引、`/api/menus` 返回值、页面路径和 layout。模块源码变化后，Shell 不会自动热加载；需要重新打包、安装并装配。当前 tgz 被 Git 忽略且 Shell 使用 `file:` 路径，新检出环境需先生成指定版本的包，或改用可复现的包发布方式。
