import { Shimmer } from "@/components/shared/Shimmer";

/**
 * /admin/rooms/[slug] — 4 editor section cards (Inventory, Rates, Photos,
 * Availability). Skeleton them as plain placeholder cards.
 */
export default function AdminRoomEditLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-3 w-32" rounded="rounded-md" />
        <Shimmer className="h-7 w-56" rounded="rounded-md" />
        <Shimmer className="h-3 w-72 max-w-full" rounded="rounded-md" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-warm bg-white p-5 shadow-sm"
        >
          <Shimmer className="h-4 w-24" rounded="rounded-md" />
          <Shimmer className="mt-2 h-3 w-3/4" rounded="rounded-md" />
          <Shimmer className="mt-4 h-24 w-full" rounded="rounded-lg" />
        </div>
      ))}
    </div>
  );
}
