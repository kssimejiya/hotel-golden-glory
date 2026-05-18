import {
  AdminPageHeaderSkeleton,
} from "@/components/shared/Skeletons";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Default loading skeleton for /admin/* routes. The (authenticated) layout
 * already shows the sidebar + email chip, so this only mocks the right pane.
 * Per-segment loading.tsx files override this with tailored layouts where
 * it's worth it (admin dashboard with stat cards, bookings table, etc).
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer
            key={i}
            className="h-24 w-full"
            rounded="rounded-xl"
          />
        ))}
      </div>
      <Shimmer
        className="h-64 w-full"
        rounded="rounded-xl"
      />
    </div>
  );
}
