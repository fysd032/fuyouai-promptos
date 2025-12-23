// lib/api/withRouteError.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export type RouteHandler = (req: Request, ctx?: any) => Promise<Response>;

export function withRouteError(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const traceId = req.headers.get("x-trace-id") || randomUUID();

    try {
      const res = await handler(req, ctx);
      res.headers.set("x-trace-id", traceId);
      return res;
    } catch (err: any) {
      const message = err?.message || String(err);
      const stack = err?.stack || "";

      const code =
        /api key|unauthorized|401|403/i.test(message) ? "UPSTREAM_AUTH" :
        /timeout|timed out|ETIMEDOUT/i.test(message) ? "UPSTREAM_TIMEOUT" :
        /ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(message) ? "UPSTREAM_NETWORK" :
        /json/i.test(message) ? "JSON_PARSE" :
        "INTERNAL";

      console.error(`[route-error] traceId=${traceId} code=${code}`, message, stack);

      return NextResponse.json(
        {
          ok: false,
          requestId: traceId,
          error: {
            code,
            message,
            hint: hintFor(code),
          },
        },
        { status: 500, headers: { "x-trace-id": traceId } }
      );
    }
  };
}

function hintFor(code: string) {
  switch (code) {
    case "UPSTREAM_AUTH":
      return "上游鉴权失败：检查模型 API Key / BaseURL / 代理鉴权";
    case "UPSTREAM_TIMEOUT":
      return "上游超时：检查网络/代理或为 runEngine 增加 timeout";
    case "UPSTREAM_NETWORK":
      return "网络不可达：检查代理、DNS、上游服务是否可访问";
    case "JSON_PARSE":
      return "请求体 JSON 解析失败：检查 fetch 是否 JSON.stringify + Content-Type";
    default:
      return "查看终端日志堆栈（含 traceId）定位具体 throw 点";
  }
}
