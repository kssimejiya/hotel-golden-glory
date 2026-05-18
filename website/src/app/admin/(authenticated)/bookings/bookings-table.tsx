"use client";

import { useState } from "react";
import Link from "next/link";
import { getRoomBySlug } from "@/lib/content";
import type { Booking, BookingStatus } from "@/types";

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

const statusFilters: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Awaiting Payment", value: "awaiting_payment" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Failed", value: "failed" },
];

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter bookings by status"
        className="inline-flex flex-wrap gap-1 rounded-xl border border-border-warm bg-white p-1 shadow-sm"
      >
        {statusFilters.map((sf) => {
          const active = filter === sf.value;
          return (
            <button
              key={sf.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(sf.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-charcoal text-white shadow-sm"
                  : "text-soft-gray hover:bg-cream hover:text-charcoal"
              }`}
            >
              {sf.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-charcoal">
              {bookings.length === 0
                ? "No bookings yet"
                : "No bookings match this filter"}
            </p>
            <p className="mt-1 text-xs text-soft-gray">
              {bookings.length === 0
                ? "Bookings created on the website will appear here."
                : "Try the All tab to see every booking."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-warm bg-cream/50 text-left text-xs font-medium text-soft-gray">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filtered.map((b) => {
                  const room = getRoomBySlug(b.roomSlug);
                  return (
                    <tr key={b.bookingId} className="hover:bg-cream/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/bookings/${b.bookingId}`}
                          className="font-medium text-blue hover:text-blue-dark"
                        >
                          {b.bookingId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-charcoal">
                            {b.guest.fullName}
                          </p>
                          <p className="text-xs text-soft-gray">
                            {b.guest.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal">
                        {room?.shortName ?? b.roomSlug}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-soft-gray">
                        {b.dates.checkIn} &rarr; {b.dates.checkOut}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-charcoal">
                        ₹{b.pricing.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[b.status].wrap}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyles[b.status].dot}`}
                          />
                          {statusStyles[b.status].label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
