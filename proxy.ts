import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

/* ── i18n constants ─────────────────────────────────────────────── */
const LOCALE_COOKIE = "NEXT_LOCALE";
const locales = routing.locales;
const defaultLocale = routing.defaultLocale;
const intlMiddleware = createIntlMiddleware(routing);

function getPathnameLocale(pathname: string): string | null {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
}

/* ── mobile redirect constants ──────────────────────────────────── */
const MOBILE_RE = /Android|iPhone|iPod|Windows Phone|Mobile|Opera Mini/i;

/* ── proxy (runs on every matched request) ──────────────────────── */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ================================================================
   * 1) Mobile redirect — /modules → /m2  (original logic, untouched)
   * ================================================================ */
  if (pathname.startsWith("/modules")) {
    const ua = req.headers.get("user-agent") ?? "";
    if (MOBILE_RE.test(ua) && pathname === "/modules") {
      return NextResponse.redirect(new URL("/m2", req.url));
    }
    // /modules/* is not under [locale], pass through
    return NextResponse.next();
  }

  /* ================================================================
   * 2) Skip paths that don't need i18n
   * ================================================================ */
  if (
    pathname.startsWith("/m2") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/try")
  ) {
    return NextResponse.next();
  }

  /* ================================================================
   * 3) i18n locale routing
   * ================================================================ */

  // 3a. Path already has a locale prefix (e.g. /zh/pricing)
  //     → set cookie to remember choice, let next-intl handle rendering.
  const pathnameLocale = getPathnameLocale(pathname);
  if (pathnameLocale) {
    const response = intlMiddleware(req);
    response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  }

  // 3b. No locale prefix → decide which locale to assign.

  // Cookie takes priority (user previously chose a language).
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
    const url = req.nextUrl.clone();
    url.pathname = `/${cookieLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Cloudflare geo header: CN → zh, everything else → en.
  const country = req.headers.get("CF-IPCountry") ?? "";
  const detectedLocale = country === "CN" ? "zh" : defaultLocale;

  const url = req.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/*          (API routes)
     * - /_next/*        (Next.js internals)
     * - /favicon.ico    (favicon)
     * - /public/*       (static assets)
     * - files with extensions (e.g. .png, .css, .js)
     */
    "/((?!api|_next|favicon\\.ico|public|.*\\..*).*)",
  ],
};
