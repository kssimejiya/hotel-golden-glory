import { Shimmer } from "@/components/shared/Shimmer";

/**
 * /admin/login — the page already shows a centered form; the loading
 * skeleton mirrors that layout. The page itself calls verifyAdminSession()
 * server-side to decide whether to redirect or render, so a placeholder
 * fills the gap between click and that decision.
 */
export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border-warm bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <Shimmer className="mx-auto h-6 w-32" rounded="rounded-md" />
          <Shimmer className="mx-auto h-3 w-40" rounded="rounded-md" />
        </div>
        <div className="space-y-3">
          <Shimmer className="h-3 w-12" rounded="rounded-md" />
          <Shimmer className="h-10 w-full" rounded="rounded-lg" />
          <Shimmer className="h-3 w-16" rounded="rounded-md" />
          <Shimmer className="h-10 w-full" rounded="rounded-lg" />
        </div>
        <Shimmer className="h-10 w-full" rounded="rounded-lg" />
      </div>
    </div>
  );
}
