"use server";

import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { destroyAdminSession, verifyAdminSession } from "./session";

/**
 * Logout server action wired into the AdminSidebar logout form. Clears the
 * session cookie and, best-effort, revokes refresh tokens so a parallel tab
 * with a cached ID token can't mint a fresh session.
 *
 * The login flow no longer lives here — it's a client-side flow against
 * Firebase Auth (see login-form.tsx) that finishes by POSTing the ID token
 * to /api/admin/session.
 */
export async function logoutAction() {
  const current = await verifyAdminSession();
  if (current) {
    try {
      await adminAuth().revokeRefreshTokens(current.uid);
    } catch (err) {
      console.warn("[logoutAction] revokeRefreshTokens failed:", err);
    }
  }
  await destroyAdminSession();
  redirect("/admin/login");
}
