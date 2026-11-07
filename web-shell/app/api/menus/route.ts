import { cookies } from "next/headers";

import { resolveSessionUser } from "@/server/auth/session";
import { buildRuntimeMenus } from "@/server/runtime/navigation";

export const dynamic = "force-dynamic";

/**
 * Shell 菜单接口（与业务模块的 /api/menus 同一约定）：
 * - menus：当前会话可见的原始菜单，PactorHost 作为附加 sitemap 源合并，
 *   供 PactorApp 解析路由与布局；
 * - navigation：同一批菜单拆成 Shell 一级菜单（root）与各应用二级菜单（modules）。
 */
export async function GET() {
  const store = await cookies();
  const user = resolveSessionUser(store);
  return Response.json(buildRuntimeMenus(user), {
    headers: { "cache-control": "no-store" },
  });
}
