import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 /app 和 /app/*
  if (!pathname.startsWith("/app")) return NextResponse.next();

  // 放行 Next 内置、API、静态资源
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/app/assets")) return NextResponse.next();

  // 放行带扩展名的文件（.js .css .png .ico .map 等）
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return NextResponse.next();

  // 其余都重写到 /app/index.html（SPA fallback）
  const url = req.nextUrl.clone();
  url.pathname = "/app/index.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
