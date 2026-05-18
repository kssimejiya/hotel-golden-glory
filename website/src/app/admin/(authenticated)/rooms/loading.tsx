import {
  AdminPageHeaderSkeleton,
} from "@/components/shared/Skeletons";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * /admin/rooms — 2-col grid of room cards (image + meta).
 */
export default function AdminRoomsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm"
          >
            <Shimmer
              className="h-32 w-32 shrink-0"
              rounded=""
            />
            <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-3">
              <Shimmer className="h-2 w-32" rounded="rounded-md" />
              <Shimmer className="h-5 w-40" rounded="rounded-md" />
              <Shimmer className="h-3 w-48 max-w-full" rounded="rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
