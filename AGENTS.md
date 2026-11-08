# 仓库协作说明

- 菜单配置、运行时数据流及三种维护方式的支持状态以 [菜单配置指南](web-shell/docs/menu-configuration.md) 为准；其中 Shell 统一管理全部菜单目前只是待实现方案。
- Shell 和应用是独立工程。修改模块源码后需重新打包、在 Shell 安装新包并装配；不要手改 `.generated/`、`dist-module/` 或装配生成的 `public/modules/` 文件。
- 菜单可见性不是授权；修改菜单或页面访问控制时同时检查服务端 DSL 和业务 API 权限。
- 保留现有用户修改和各子工程 `AGENTS.md` 中 Next.js 自动维护的规则。
