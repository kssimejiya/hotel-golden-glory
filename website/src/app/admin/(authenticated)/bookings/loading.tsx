import {
  AdminPageHeaderSkeleton,
  TableRowSkeleton,
} from "@/components/shared/Skeletons";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * /admin/bookings — filter pills + table. Skeleton the rows so the layout
 * doesn't shift when real data arrives.
 */
export default function AdminBookingsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeaderSkeleton />
      {/* Filter pill bar */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer
            key={i}
            className="h-8 w-24"
            rounded="rounded-lg"
          />
        ))}
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-border-warm bg-cream/50 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer
              key={i}
              className="h-2 w-16"
              rounded="rounded-md"
            />
          ))}
        </div>
        <div className="divide-y divide-border-warm">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
