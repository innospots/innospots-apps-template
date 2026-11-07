import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SitemapResource } from "pactor-app";
import { parse } from "yaml";

/**
 * 菜单接口数据源：菜单配置独立于 sitemap.yaml，由 /api/menus 下发。
 * 后续可替换为数据库 / 权限服务查询，客户端只依赖接口响应结构。
 */

const MENUS_FILE = join(process.cwd(), "src/server/yaml/menus.yaml");

export function buildMenus(): SitemapResource["menus"] {
  return parse(readFileSync(MENUS_FILE, "utf8")) as SitemapResource["menus"];
}
