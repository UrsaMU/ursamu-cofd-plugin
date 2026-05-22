/**
 * Handler for all /api/v1/cofd routes.
 * Registered in init() via registerPluginRoute().
 *
 * Note: this route persists until server restart and cannot be hot-unloaded.
 */
// deno-lint-ignore require-await
export async function routeHandler(req: Request, userId: string | null): Promise<Response> {
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const _url   = new URL(req.url);
  const method = req.method;

  if (method === "GET") {
    // Confirm the route is live without disclosing the plugin identifier.
    // The caller already knows the path they hit; echoing the plugin name
    // only helps enumeration.
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
