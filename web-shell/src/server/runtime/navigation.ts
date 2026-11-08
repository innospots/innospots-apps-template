import { getMenusIndex, getPagesIndex, getSitemapMeta } from "@/modules/registry";
import type { PageIndexEntry } from "@/modules/types";
import type { ShellUser } from "@/server/auth/session";

import { filterVisibleMenus } from "./visibility";

/** 导航项（key = 跳转路径，供 Menu 选中态与 navigate 动作使用） */
export type ShellNavigationItem = {
  key: string;
  label: string;
  icon?: string;
  children?: ShellNavigationItem[];
};

/** Shell 一级菜单项：moduleId 指向该应用，用于取应用自己的二级菜单 */
export type ShellRootNavigationItem = ShellNavigationItem & {
  moduleId?: string;
  menuPaths?: string[];
  submenu?: ShellNavigationItem[];
};

/**
 * Shell 运行时导航模型（由 /api/menus 按请求构建并下发）：
 * - root：一级菜单（最左侧 60px 图标轨）；
 * - modules：按模块 id 归组的二级菜单，仅当前应用的列表下发给应用布局。
 */
export type ShellNavigation = {
  user: ShellUser | null;
  app: { name: string };
  root: ShellRootNavigationItem[];
  modules: Record<string, ShellNavigationItem[]>;
};

/**
 * 菜单接口响应：既包含 sitemap 片段（menus 供 PactorApp 合并后解析
 * 路由与布局），也包含预构建的两级导航（navigation 供 Shell 直接渲染）。
 */
export type ShellMenusResource = {
  id: string;
  resourceType: "sitemap";
  version: number;
  dslVersion: string;
  layouts: Record<string, never>;
  pages: never[];
  menus: RawMenu[];
  navigation: ShellNavigation;
};

type RawMenu = Record<string, unknown>;

function isRecord(value: unknown): value is RawMenu {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** 菜单所属模块：装配期的 moduleId 标记优先，其次从页面 id 前缀解析 */
function resolveModuleId(
  item: RawMenu,
  pagesById: Map<string, PageIndexEntry>,
): string | undefined {
  if (typeof item.moduleId === "string" && item.moduleId !== "") {
    return item.moduleId;
  }
  if (typeof item.pageId !== "string") return undefined;
  const page = pagesById.get(item.pageId);
  if (page !== undefined) return page.moduleId;
  const separator = item.pageId.indexOf(":");
  return separator > 0 ? item.pageId.slice(0, separator) : undefined;
}

function toNavigationItem(
  item: RawMenu,
  pagesById: Map<string, PageIndexEntry>,
): ShellNavigationItem | null {
  // 与 MenuRegistry.tree() 一致：隐藏条目不出现在导航中
  if (item.hidden === true) return null;

  const page =
    typeof item.pageId === "string" ? pagesById.get(item.pageId) : undefined;
  const key =
    typeof item.path === "string"
      ? item.path
      : page?.path ??
        (typeof item.id === "string" ? item.id : undefined);
  if (key === undefined) return null;

  const label =
    typeof item.title === "string" ? item.title : (page?.title ?? key);
  const children = Array.isArray(item.children)
    ? item.children
        .map((child) =>
          isRecord(child) ? toNavigationItem(child, pagesById) : null,
        )
        .filter((child): child is ShellNavigationItem => child !== null)
    : undefined;

  return {
    key,
    label,
    ...(typeof item.icon === "string" ? { icon: item.icon } : {}),
    ...(children !== undefined ? { children } : {}),
  };
}

/**
 * 构建 /api/menus 的响应：
 * - menus：按当前会话过滤后的原始菜单，PactorApp 作为附加 sitemap 源合并；
 * - navigation：同一批菜单拆成一级菜单（root: true）与各应用的二级菜单。
 */
export function buildRuntimeMenus(user: ShellUser | null): ShellMenusResource {
  const { pages } = getPagesIndex();
  const { menus } = getMenusIndex();
  const meta = getSitemapMeta();

  const pagesById = new Map(pages.map((page) => [page.globalPageId, page]));
  const visible = filterVisibleMenus(menus, user, pages);

  const root: ShellRootNavigationItem[] = [];
  const modules: Record<string, ShellNavigationItem[]> = {};

  for (const raw of visible) {
    if (!isRecord(raw)) continue;
    if (raw.root === true && raw.type === "group" && Array.isArray(raw.children)) {
      const children = raw.children
        .map((child) => isRecord(child) ? toNavigationItem(child, pagesById) : null)
        .filter((child): child is ShellNavigationItem => child !== null);
      if (children.length === 0) continue;
      const paths = (items: ShellNavigationItem[]): string[] => items.flatMap((item) =>
        item.children?.length ? paths(item.children) : [item.key],
      );
      root.push({
        key: paths(children)[0],
        label: typeof raw.title === "string" ? raw.title : String(raw.id),
        ...(typeof raw.icon === "string" ? { icon: raw.icon } : {}),
        moduleId: resolveModuleId(raw, pagesById),
        menuPaths: paths(children),
        submenu: children,
      });
      continue;
    }
    const item = toNavigationItem(raw, pagesById);
    if (item === null) continue;

    if (raw.root === true) {
      const moduleId = resolveModuleId(raw, pagesById);
      root.push(moduleId !== undefined ? { ...item, moduleId } : item);
      continue;
    }

    const moduleId = resolveModuleId(raw, pagesById);
    if (moduleId === undefined) continue;
    (modules[moduleId] ??= []).push(item);
  }

  return {
    id: "innospots-shell-menus",
    resourceType: "sitemap",
    version: 1,
    dslVersion: meta.dslVersion,
    layouts: {},
    pages: [],
    menus: visible.filter(isRecord),
    navigation: {
      user,
      app: meta.app,
      root,
      modules,
    },
  };
}
