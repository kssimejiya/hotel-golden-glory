"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X, BedDouble, CalendarX, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { setAvailabilityBlockAction } from "@/lib/admin/room-actions";
import type { DateOccupancy } from "@/lib/firebase/availabilityRepo";

interface BlockDoc {
  blocked: number;
  held: number;
  reason?: string;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0]!;
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function AvailabilityEditor({
  slug,
  totalRooms,
  existingBlocks,
  occupancy,
}: {
  slug: string;
  totalRooms: number;
  existingBlocks: Record<string, BlockDoc>;
  occupancy: DateOccupancy[];
}) {
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(() => plusDaysIso(0));
  const [blockedStr, setBlockedStr] = useState("0");
  const blocked = parseInt(blockedStr, 10) || 0;
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await setAvailabilityBlockAction(
        slug,
        fromDate,
        toDate,
        blocked,
        reason || undefined
      );
      if (res?.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const blockDates = Object.keys(existingBlocks).sort();

  return (
    <div className="space-y-5">
      {/* Occupancy overview */}
      <OccupancyOverview occupancy={occupancy} totalRooms={totalRooms} />

      {/* Block form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="font-medium text-charcoal">From date</span>
            <input
              type="date"
              required
              value={fromDate}
              min={todayIso()}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-charcoal">To date (inclusive)</span>
            <input
              type="date"
              required
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="font-medium text-charcoal">Rooms to block</span>
            <input
              type="number"
              required
              min={0}
              max={totalRooms}
              value={blockedStr}
              onFocus={(e) => {
                if (e.target.value === "0") setBlockedStr("");
              }}
              onBlur={() => {
                if (blockedStr === "") setBlockedStr("0");
              }}
              onChange={(e) => setBlockedStr(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <span className="mt-1 block text-[10px] text-soft-gray">
              of {totalRooms} total · 0 to unblock
            </span>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-charcoal">Reason (optional)</span>
            <input
              type="text"
              maxLength={120}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Renovation, owner stay"
              className="mt-1 w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Apply
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>

      {/* Current blocks list */}
      <div className="border-t border-border-warm pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
          Current blocks (next 90 days)
        </h3>
        {blockDates.length === 0 ? (
          <p className="mt-2 text-xs text-soft-gray">No admin blocks set.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border-warm">
            {blockDates.map((date) => {
              const b = existingBlocks[date]!;
              return (
                <li
                  key={date}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <div>
                    <span className="font-medium text-charcoal">{date}</span>
                    <span className="ml-3 inline-flex items-center gap-2 text-soft-gray">
                      {b.blocked > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {b.blocked} blocked
                        </span>
                      )}
                      {b.reason && <span className="italic">{b.reason}</span>}
                    </span>
                  </div>
                  {b.blocked > 0 && <UnblockButton slug={slug} date={date} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function OccupancyOverview({
  occupancy,
  totalRooms,
}: {
  occupancy: DateOccupancy[];
  totalRooms: number;
}) {
  if (occupancy.length === 0) return null;

  const activeDates = occupancy.filter((d) => d.booked > 0 || d.blocked > 0);
  const peakOccupied = Math.max(
    ...occupancy.map((d) => d.booked + d.blocked),
    0
  );
  const peakDate = occupancy.find(
    (d) => d.booked + d.blocked === peakOccupied
  );
  const todayData = occupancy.find(
    (d) => d.date === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border-warm bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
                Today
              </p>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-charcoal">
                {todayData?.available ?? totalRooms}
                <span className="ml-1 text-sm font-normal text-soft-gray">
                  / {totalRooms}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-soft-gray">available</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <CalendarCheck className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border-warm bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
                Booked today
              </p>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-charcoal">
                {todayData?.booked ?? 0}
              </p>
              <p className="mt-0.5 text-[10px] text-soft-gray">
                rooms occupied
              </p>
            </div>
            <div className="rounded-lg bg-blue/10 p-2">
              <BedDouble className="h-4 w-4 text-blue" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border-warm bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
                Peak (30d)
              </p>
              <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-charcoal">
                {peakOccupied}
                <span className="ml-1 text-sm font-normal text-soft-gray">
                  / {totalRooms}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-soft-gray">
                {peakDate && peakOccupied > 0
                  ? formatDateShort(peakDate.date)
                  : "no bookings"}
              </p>
            </div>
            <div className="rounded-lg bg-gold/10 p-2">
              <CalendarX className="h-4 w-4 text-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Per-date occupancy table */}
      {activeDates.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm">
          <div className="border-b border-border-warm bg-cream/50 px-4 py-3">
            <h3 className="text-xs font-medium text-soft-gray">
              Dates with bookings or blocks
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-warm bg-cream/30 text-left text-xs font-medium text-soft-gray">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-center">Booked</th>
                  <th className="px-4 py-2.5 text-center">Blocked</th>
                  <th className="px-4 py-2.5 text-center">Available</th>
                  <th className="px-4 py-2.5">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {activeDates.map((d) => {
                  const occupied = d.booked + d.blocked;
                  const pct =
                    totalRooms > 0
                      ? Math.round((occupied / totalRooms) * 100)
                      : 0;
                  const isToday =
                    d.date === new Date().toISOString().split("T")[0];
                  return (
                    <tr
                      key={d.date}
                      className={cn(
                        "hover:bg-cream/30",
                        isToday && "bg-gold/[0.04]"
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="font-medium text-charcoal">
                          {formatDateShort(d.date)}
                        </span>
                        {isToday && (
                          <span className="ml-2 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {d.booked > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue ring-1 ring-inset ring-blue/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                            {d.booked}
                          </span>
                        ) : (
                          <span className="text-xs text-soft-gray">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {d.blocked > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {d.blocked}
                          </span>
                        ) : (
                          <span className="text-xs text-soft-gray">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                            d.available === 0
                              ? "bg-red-50 text-red-600 ring-red-200"
                              : d.available <= 3
                                ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
                                : "bg-green-50 text-green-700 ring-green-200"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              d.available === 0
                                ? "bg-red-500"
                                : d.available <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            )}
                          />
                          {d.available}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-cream">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pct >= 100
                                  ? "bg-red-400"
                                  : pct >= 75
                                    ? "bg-yellow-400"
                                    : pct > 0
                                      ? "bg-blue"
                                      : ""
                              )}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs tabular-nums text-soft-gray">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDates.length === 0 && (
        <div className="rounded-xl border border-border-warm bg-white px-5 py-8 text-center shadow-sm">
          <p className="text-sm font-medium text-charcoal">
            No rooms booked or blocked
          </p>
          <p className="mt-1 text-xs text-soft-gray">
            All {totalRooms} rooms are available for the next 30 days.
          </p>
        </div>
      )}
    </div>
  );
}

function UnblockButton({ slug, date }: { slug: string; date: string }) {
  const [pending, startTransition] = useTransition();
  function handleClick() {
    startTransition(async () => {
      await setAvailabilityBlockAction(slug, date, date, 0);
    });
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded p-1 text-soft-gray hover:bg-cream hover:text-charcoal disabled:opacity-40"
      title="Remove block"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <X className="h-3 w-3" />
      )}
    </button>
  );
}
