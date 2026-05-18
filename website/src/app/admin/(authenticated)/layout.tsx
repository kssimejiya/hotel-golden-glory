import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { verifyAdminSession } from "@/lib/admin/session";

/**
 * Authoritative auth gate for every /admin/(authenticated) page.
 * proxy.ts already redirects when the cookie is missing; this layer also
 * cryptographically verifies it, so a forged/expired cookie fails closed.
 */
export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar email={user.email} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
