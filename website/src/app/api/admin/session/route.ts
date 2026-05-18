import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import {
  createAdminSessionCookie,
  destroyAdminSession,
  verifyAdminSession,
} from "@/lib/admin/session";

/**
 * POST /api/admin/session  { idToken } → set session cookie.
 * DELETE /api/admin/session            → clear session cookie + revoke refresh tokens.
 */

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const idToken =
    body && typeof body === "object" && "idToken" in body
      ? (body as { idToken: unknown }).idToken
      : null;
  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  const result = await createAdminSessionCookie(idToken);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: result.user });
}

export async function DELETE() {
  // Best-effort: revoke refresh tokens for the current user so the next
  // signed-in tab can't mint a new session from a stale ID token.
  const current = await verifyAdminSession();
  if (current) {
    try {
      await adminAuth().revokeRefreshTokens(current.uid);
    } catch (err) {
      console.warn("[api/admin/session] revokeRefreshTokens failed:", err);
    }
  }
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
