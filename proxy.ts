import { NextRequest, NextResponse } from "next/server";

const MOBILE_RE = /Android|iPhone|iPod|Windows Phone|Mobile|Opera Mini/i;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle /modules, pass through everything else
  if (!pathname.startsWith("/modules")) {
    return NextResponse.next();
  }

  // Redirect mobile devices to /m2
  const ua = req.headers.get("user-agent") ?? "";
  if (MOBILE_RE.test(ua)) {
    return NextResponse.redirect(new URL("/m2", req.url));
  }

  // TODO: add auth logic here
  return NextResponse.next();
}

export const config = {
  matcher: ["/modules/:path*"],
};
