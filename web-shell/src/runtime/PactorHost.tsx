"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createHttpHooks, SitemapApp } from "pactor-app";

import { moduleExtensions } from "@generated/pactor/client-registry";

import type {
  ShellNavigation,
  ShellRootNavigationItem,
} from "@/server/runtime/navigation";

import {
  createShellNavigate,
  runtimeMenusSource,
  runtimePageEndpoint,
  runtimeSitemapSource,
} from "./pactor-adapter";
import { mergeModuleActions, mergeModuleComponents } from "./register-extensions";

/**
 * HTTP 数据源钩子：拆分 { code, data, message } 包裹协议。
 * 模块页面 DSL 中的 dataSources（如 /api/modules/<moduleId>/risk-analysis/*）依赖它；
 * 模块级常量保证引用稳定，避免页面/布局工厂随渲染重建。
 */
const httpAdapter = createHttpHooks();

type MenusResponse = {
  navigation: ShellNavigation;
};

/** 当前路径所属的一级菜单：精确命中或位于其子路径下（取最长前缀） */
function matchRoot(
  root: ShellRootNavigationItem[],
  pathname: string,
): ShellRootNavigationItem | null {
  let matched: ShellRootNavigationItem | null = null;
  for (const item of root) {
    const base = item.key.replace(/\/+$/, "");
    const hit = pathname === base || pathname.startsWith(`${base}/`);
    if (hit && (matched === null || item.key.length > matched.key.length)) {
      matched = item;
    }
  }
  return matched;
}

/** 同源路径判断（fetcher 里不做任何 DOM 依赖，SSR 安全） */
function pathnameOf(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url;
  }
}

function PactorHostInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 菜单从 /api/menus 获取：一次请求同时拿到一级 / 二级导航。
  const [navigation, setNavigation] = useState<ShellNavigation | null>(null);
  const menusRequest = useRef<Promise<MenusResponse> | null>(null);

  const loadMenus = useCallback((): Promise<MenusResponse> => {
    if (menusRequest.current !== null) {
      return menusRequest.current;
    }

    const request = fetch(runtimeMenusSource, {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`菜单接口请求失败：HTTP ${response.status}`);
        }
        return (await response.json()) as MenusResponse;
      })
      .then((payload) => {
        setNavigation(payload.navigation);
        return payload;
      });

    menusRequest.current = request;
    // 失败后允许下次重试，而不是缓存一个永远 reject 的 Promise。
    request.catch(() => {
      if (menusRequest.current === request) {
        menusRequest.current = null;
      }
    });
    return request;
  }, []);

  useEffect(() => {
    loadMenus().catch((error: unknown) => {
      console.error("[shell] 菜单加载失败", error);
    });
  }, [loadMenus]);

  // PactorApp 也把 /api/menus 当作 sitemap 源：复用上面同一次请求的结果，
  // 避免页面加载时重复请求菜单接口。
  const fetcher = useCallback<typeof fetch>(
    async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (pathnameOf(url) === runtimeMenusSource) {
        return Response.json(await loadMenus());
      }
      return fetch(input, init);
    },
    [loadMenus],
  );

  // 引用取自 navigation.root：同一应用内跨路由保持不变，切换应用时才变化，
  // 因此只会在切换应用时重建布局（重新拉取 session）。
  const activeRoot = useMemo(
    () =>
      navigation === null ? null : matchRoot(navigation.root, pathname),
    [navigation, pathname],
  );

  // 覆盖框架内建的 session.context：
  // - rootMenus / activeRootKey 供 Shell 布局的 60px 一级菜单使用；
  // - menus 只下发给当前所属应用，应用布局据此渲染自己的二级菜单。
  const services = useMemo(() => {
    const session = {
      user: navigation?.user ?? undefined,
      app: navigation?.app ?? { name: "InnoSpots" },
      rootMenus: navigation?.root ?? [],
      activeRootKey: activeRoot?.key,
      menus:
        activeRoot?.moduleId !== undefined
          ? (navigation?.modules[activeRoot.moduleId] ?? [])
          : [],
    };
    return {
      "session.context": () => Promise.resolve(session),
    };
  }, [navigation, activeRoot]);

  return (
    <SitemapApp
      sources={[runtimeSitemapSource, runtimeMenusSource]}
      baseUrl=""
      pathname={pathname}
      query={Object.fromEntries(searchParams.entries())}
      navigate={createShellNavigate(router)}
      components={mergeModuleComponents(moduleExtensions)}
      actions={mergeModuleActions(moduleExtensions)}
      services={services}
      fetcher={fetcher}
      httpAdapter={httpAdapter}
      pageEndpoint={runtimePageEndpoint}
    />
  );
}

export function PactorHost() {
  return (
    <Suspense fallback={null}>
      <PactorHostInner />
    </Suspense>
  );
}
