import type { LayoutDsl, SitemapResource } from "pactor-app";

import { getPagesIndex, getSitemapMeta } from "@/modules/registry";
import type { ShellUser } from "@/server/auth/session";

import { readGeneratedDsl } from "./assembly-io";
import { canSeePage } from "./visibility";

export function buildRuntimeBootstrap(user: ShellUser | null): SitemapResource {
  const meta = getSitemapMeta();
  const { pages } = getPagesIndex();

  const visiblePages = pages.filter((p) => canSeePage(p, user));

  const sitemapPages: SitemapResource["pages"] = visiblePages.map((p) => {
    const base = {
      id: p.globalPageId,
      path: p.path,
      title: p.title,
      version: p.version,
    };
    if (p.lazy) return base;
    if (!p.dslRef) return base;
    return { ...base, pageDsl: readGeneratedDsl(p.dslRef) };
  });

  const layouts = meta.layouts as Record<string, LayoutDsl>;

  return {
    id: "innospots-web-shell",
    resourceType: "sitemap",
    version: 1,
    dslVersion: meta.dslVersion,
    app: meta.app,
    layout: meta.layout,
    auth: meta.auth,
    layouts,
    updatedAt: new Date().toISOString(),
    ...(user
      ? {
          user: {
            id: user.id,
            username: user.username,
            name: user.name ?? user.username,
          },
          permissions: user.permissions,
        }
      : {}),
    pages: sitemapPages,
    // 菜单由 /api/menus 单独下发（PactorHost 作为附加 sitemap 源合并），
    // 保证与本轮会话的可见性过滤结果一致，不在 bootstrap 中重复内联。
    menus: [],
  };
}
