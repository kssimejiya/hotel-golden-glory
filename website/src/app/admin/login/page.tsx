import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  // If already authenticated, skip the form and go straight to the dashboard.
  const user = await verifyAdminSession();
  if (user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border-warm bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-charcoal">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-soft-gray">Hotel Golden Glory</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
