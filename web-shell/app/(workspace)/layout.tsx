// 模块自带样式：装配器按各模块 manifest 的 styles 生成 import。
import "@generated/pactor/module-styles";

// 皮肤 / 主题令牌由 Shell 统一提供，两个业务模块共用同一套变量。
import "@/modules/styles/theme.css";

import { PactorHost } from "@/runtime/PactorHost";

/**
 * 工作区 layout 挂载 Pactor Host（与 console 工程一致：layout 跨导航常驻）。
 * 具体 URL 是否合法由 [...slug] page 在服务端用装配路由表校验。
 *
 * 菜单不在 layout 中内联：PactorHost 从 /api/menus 获取两级导航，
 * 再把当前应用的二级菜单通过 session.context 服务注入布局。
 */
export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PactorHost />
      {children}
    </>
  );
}
