import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Booking detail — header + 3-4 info cards. Shows the layout immediately
 * while Firestore fetches the booking.
 */
export default function AdminBookingDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Shimmer className="h-3 w-32" rounded="rounded-md" />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Shimmer className="h-7 w-56" rounded="rounded-md" />
          <Shimmer className="h-3 w-40" rounded="rounded-md" />
        </div>
        <Shimmer className="h-8 w-40" rounded="rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-warm bg-white p-5 shadow-sm"
        >
          <Shimmer className="h-4 w-32" rounded="rounded-md" />
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Shimmer className="h-2 w-16" rounded="rounded-md" />
                <Shimmer className="h-3 w-32" rounded="rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
