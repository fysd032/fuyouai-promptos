import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 /app 和 /app/*
  if (!pathname.startsWith("/app")) return NextResponse.next();

  // 放行 Next 内置、API、静态资源、以及带扩展名的文件（.js .css .png 等）
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/app/assets") ||
    pathname === "/app/index.html" ||
  ) {
    return NextResponse.next();
  }

  // 其余所有 /app/* → /app/index.html（SPA fallback）
  const url = req.nextUrl.clone();
  url.pathname = "/app/index.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
