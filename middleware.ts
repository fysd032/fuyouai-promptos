import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect bare /login (and /login?from=...) to /{locale}/login
 * so that hardcoded /login links across the app land on the
 * locale-aware login page instead of a 404 / English fallback.
 */

const LOCALE_ROUTES = ["/login"];

function detectLocale(req: NextRequest): "en" | "zh" {
  // 1. Cookie (user's explicit choice)
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie === "en" || cookie === "zh") return cookie;

  // 2. Accept-Language header
  const al = req.headers.get("accept-language") ?? "";
  if (al.startsWith("zh") || al.includes(",zh")) return "zh";

  return "en";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept bare /login (not /en/login or /zh/login)
  const needsRedirect = LOCALE_ROUTES.some(
    (route) => pathname === route || pathname === `${route}/`
  );

  if (!needsRedirect) return NextResponse.next();

  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname.replace(/\/$/, "")}`;
  // query params (?from=...) are preserved automatically via nextUrl.clone()

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/login"],
};
