import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Shell 与 Pactor 之间的适配层（非 Pactor 官方 API）。
 * 后续按锁定版本补齐 Loader / Service / Action 注册细节。
 */
export function createShellNavigate(router: AppRouterInstance) {
  return (to: string) => {
    router.push(to);
  };
}

export const runtimeSitemapSource = "/api/runtime/bootstrap";

/** 菜单接口：作为附加 sitemap 源，与 bootstrap 合并出路由 / 布局所需的菜单 */
export const runtimeMenusSource = "/api/menus";

export const runtimePageEndpoint = (pageId: string) =>
  `/api/runtime/pages/${encodeURIComponent(pageId)}`;
