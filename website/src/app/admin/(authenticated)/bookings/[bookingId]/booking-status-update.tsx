"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatusAction } from "@/lib/admin/booking-actions";
import type { BookingStatus } from "@/types";

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const statusStyles: Record<BookingStatus, { wrap: string; dot: string; label: string }> = {
  draft: {
    wrap: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
    label: "Draft",
  },
  awaiting_payment: {
    wrap: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    dot: "bg-yellow-500",
    label: "Awaiting payment",
  },
  confirmed: {
    wrap: "bg-green-50 text-green-700 ring-green-200",
    dot: "bg-green-500",
    label: "Confirmed",
  },
  cancelled: {
    wrap: "bg-red-50 text-red-600 ring-red-200",
    dot: "bg-red-500",
    label: "Cancelled",
  },
  failed: {
    wrap: "bg-red-50 text-red-600 ring-red-200",
    dot: "bg-red-500",
    label: "Failed",
  },
};

export function BookingStatusUpdate({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(newStatus: BookingStatus) {
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, newStatus);
      if (result.error) {
        setError(result.error);
        setStatus(currentStatus);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status].wrap}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusStyles[status].dot}`}
          />
          {statusStyles[status].label}
        </span>
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as BookingStatus)}
          disabled={isPending}
          aria-label="Change booking status"
          className="rounded-lg border border-border-warm bg-white px-2.5 py-1 text-xs font-medium text-charcoal shadow-sm transition-colors hover:border-gold focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Change to: {opt.label}
            </option>
          ))}
        </select>
      </div>
      {isPending && (
        <span className="inline-flex items-center gap-1.5 text-xs text-soft-gray">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-soft-gray border-t-transparent" />
          Saving…
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
