import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle /modules, pass through everything else
  if (!pathname.startsWith("/modules")) {
    return NextResponse.next();
  }

  // TODO: add auth logic here
  return NextResponse.next();
}

export const config = {
  matcher: ["/modules/:path*"],
};
