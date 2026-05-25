import { bookingRepo } from "@/lib/services";
import { getRoomBySlug } from "@/lib/content";
import type { Booking, BookingStatus } from "@/types";
import Link from "next/link";
import { CalendarRange, IndianRupee, BedDouble, Clock } from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  currency,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  currency?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-warm bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
            {label}
          </p>
          <p
            className={
              currency
                ? "mt-2 text-2xl font-bold tabular-nums text-charcoal"
                : "mt-2 font-display text-2xl font-bold tabular-nums text-charcoal"
            }
          >
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-soft-gray">{sub}</p>}
        </div>
        <div className="rounded-lg bg-gold/10 p-2">
          <Icon className="h-5 w-5 text-gold" />
        </div>
      </div>
    </div>
  );
}

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

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const bookings = await bookingRepo.list();

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const pending = bookings.filter(
    (b) => b.status === "awaiting_payment" || b.status === "draft"
  );
  const totalRevenue = confirmed.reduce(
    (sum, b) => sum + b.pricing.total,
    0
  );

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-soft-gray">
          At-a-glance overview of bookings and revenue.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CalendarRange}
          label="Total Bookings"
          value={String(bookings.length)}
        />
        <StatCard
          icon={BedDouble}
          label="Confirmed"
          value={String(confirmed.length)}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={String(pending.length)}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          sub="from confirmed bookings"
          currency
        />
      </div>

      {/* Recent bookings */}
      <div className="overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border-warm px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-charcoal">
              Recent bookings
            </h2>
            <p className="mt-0.5 text-xs text-soft-gray">
              The five most recent reservations.
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-blue hover:text-blue-dark"
          >
            View all →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-charcoal">
              No bookings yet
            </p>
            <p className="mt-1 text-xs text-soft-gray">
              Bookings created on the website will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-warm">
            {recentBookings.map((b: Booking) => {
              const room = getRoomBySlug(b.roomSlug);
              return (
                <Link
                  key={b.bookingId}
                  href={`/admin/bookings/${b.bookingId}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-cream/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {b.guest.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-soft-gray">
                      {room?.shortName ?? b.roomSlug} &middot;{" "}
                      {b.dates.checkIn} &rarr; {b.dates.checkOut}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-charcoal">
                      ₹{b.pricing.total.toLocaleString("en-IN")}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
