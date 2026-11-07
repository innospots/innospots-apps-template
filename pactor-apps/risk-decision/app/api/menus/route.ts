import { buildMenus } from "@/server/menus";

export const dynamic = "force-dynamic";

/** 菜单接口：SitemapApp 作为附加 sitemap 源拉取并与 /api/sitemap 合并 */
export async function GET() {
  return Response.json(
    {
      id: "menus",
      resourceType: "sitemap",
      version: 1,
      dslVersion: "1.0",
      layouts: {},
      pages: [],
      menus: buildMenus(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
