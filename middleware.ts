import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 modules，其它一律放行
  if (!pathname.startsWith("/modules")) {
    return NextResponse.next();
  }

  // TODO: 这里保留你原来的鉴权逻辑
  return NextResponse.next();
}

export const config = {
  matcher: ["/modules/:path*"],
};
