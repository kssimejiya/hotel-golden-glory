import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Why this file is named `proxy.ts` not `middleware.ts`:
 *   In Next.js 16, "Middleware" was renamed to "Proxy" and the file
 *   convention is now `proxy.ts` (or `src/proxy.ts`). The functionality is
 *   the same. See node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 *
 * Defense in depth — two-layer auth:
 *   1. This proxy does a CHEAP cookie-presence check on every /admin/* request.
 *      It does NOT cryptographically verify the cookie (verifySessionCookie
 *      requires the firebase-admin runtime which adds latency to every request
 *      and is overkill for a redirect-vs-render decision).
 *   2. The authoritative check lives in the (authenticated)/layout.tsx which
 *      calls verifyAdminSession() server-side on every request. That call
 *      verifies the Firebase session cookie signature, expiry, and admin
 *      claim, and redirects to /admin/login on failure.
 *
 * Result: an attacker forging a malformed cookie hits the layout check and
 * gets bounced; a logged-out user with no cookie at all gets bounced here
 * (saves a render).
 */

const COOKIE_NAME = "admin-session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin/* — and never bounce the login page itself.
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie present — let the layout do the cryptographic verification.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
