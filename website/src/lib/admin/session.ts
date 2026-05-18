import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Firebase Auth session cookies for admin access.
 *
 * Flow:
 *   1. Browser does signInWithEmailAndPassword via the web SDK.
 *   2. Browser POSTs the resulting ID token to /api/admin/session.
 *   3. That route handler verifies the token + admin claim and mints a
 *      session cookie via adminAuth.createSessionCookie() (this file).
 *   4. Server actions and layouts call verifyAdminSession() which
 *      verifies the cookie via adminAuth.verifySessionCookie(checkRevoked=true).
 *
 * Custom claim `admin: true` is required — set per-account with
 * `npx tsx scripts/set-admin-claim.ts <email>`.
 */

const COOKIE_NAME = "admin-session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_SECONDS * 1000;

export interface AdminSessionUser {
  uid: string;
  email: string;
}

/**
 * Mint a session cookie from a freshly-signed-in ID token.
 * Validates the token has admin=true custom claim before issuing.
 * Returns { ok: true, ... } on success or { ok: false, error } on failure.
 */
export async function createAdminSessionCookie(
  idToken: string
): Promise<
  | { ok: true; user: AdminSessionUser }
  | { ok: false; error: string }
> {
  let decoded: DecodedIdToken;
  try {
    // checkRevoked must be true so a disabled/revoked account can't log in.
    decoded = await adminAuth().verifyIdToken(idToken, true);
  } catch (err) {
    console.error("[admin/session] verifyIdToken failed:", err);
    return { ok: false, error: "Invalid or expired sign-in token." };
  }
  if (decoded.admin !== true) {
    return {
      ok: false,
      error:
        "This account is not authorised for admin access. Contact the site owner to be granted the admin claim.",
    };
  }
  if (!decoded.email) {
    return { ok: false, error: "Account is missing an email address." };
  }

  let sessionCookie: string;
  try {
    sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: COOKIE_MAX_AGE_MS,
    });
  } catch (err) {
    console.error("[admin/session] createSessionCookie failed:", err);
    return { ok: false, error: "Could not start an admin session." };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return { ok: true, user: { uid: decoded.uid, email: decoded.email } };
}

/**
 * Authoritative session check used by the (authenticated) layout and
 * by requireAdmin() inside server actions. checkRevoked=true so a
 * disabled/revoked account is rejected even mid-session.
 *
 * Wrapped in React's `cache()` so multiple call sites within the same
 * request (e.g. the layout + a future server-component that needs the user
 * email) share ONE Firebase Auth round-trip instead of N. The current code
 * only calls this from the (authenticated) layout per navigation; the cache
 * is defensive.
 */
export const verifyAdminSession = cache(
  async (): Promise<AdminSessionUser | null> => {
    const store = await cookies();
    const cookieValue = store.get(COOKIE_NAME)?.value;
    if (!cookieValue) return null;
    try {
      const decoded = await adminAuth().verifySessionCookie(cookieValue, true);
      if (decoded.admin !== true) return null;
      if (!decoded.email) return null;
      return { uid: decoded.uid, email: decoded.email };
    } catch (err) {
      // Expired, revoked, malformed, or admin tokens out of rotation — all treated as
      // logged-out. Logging is verbose enough during dev; in production this fires
      // every time a cookie naturally expires.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[admin/session] verifySessionCookie rejected:", err);
      }
      return null;
    }
  }
);

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Lightweight presence check for proxy.ts (which runs on every protected
 * request). Does NOT verify the cookie cryptographically — that happens in
 * the layout. We only redirect-to-login if the cookie is missing entirely.
 */
export const ADMIN_SESSION_COOKIE_NAME = COOKIE_NAME;
