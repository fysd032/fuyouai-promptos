import mapping from "@/module_mapping.v2.json";
import { withRouteError } from "@/lib/api/withRouteError";

const allowedOrigins = new Set([
  "https://fuyouai-promptos.vercel.app",
  "https://fuyouai.com",
  "https://www.fuyouai.com",
]);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin &&
    (allowedOrigins.has(origin) ||
      /^https:\/\/fuyouai-promptos.*\.vercel\.app$/i.test(origin));
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

type BackendModule = { moduleId?: string; promptKey?: string; weight?: number; [key: string]: unknown };
type Variant = { variantId?: string; label?: string; description?: string; backendModules?: BackendModule[]; [key: string]: unknown };
type Module = { frontModuleId?: string; frontModuleLabel?: string; group?: string; variants?: Variant[]; [key: string]: unknown };

async function getHandler(req: Request) {
  const origin = req.headers.get("origin");

  // Strip moduleId/weight from backendModules — only expose promptKey
  const publicData = (mapping as Module[]).map(({ frontModuleId, frontModuleLabel, group, variants }) => ({
    frontModuleId,
    frontModuleLabel,
    group,
    variants: (variants ?? []).map(({ variantId, label, description, backendModules }) => ({
      variantId,
      label,
      description,
      backendModules: backendModules?.map(({ promptKey }) => ({ promptKey })),
    })),
  }));

  return new Response(
    JSON.stringify({ ok: true, version: "v2", data: publicData }, null, 2),
    {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
        "content-type": "application/json; charset=utf-8",
      },
    }
  );
}

export const GET = withRouteError(getHandler);
