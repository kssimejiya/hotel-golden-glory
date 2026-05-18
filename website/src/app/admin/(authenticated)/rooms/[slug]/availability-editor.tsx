"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { setAvailabilityBlockAction } from "@/lib/admin/room-actions";

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

export function AvailabilityEditor({
  slug,
  totalRooms,
  existingBlocks,
}: {
  slug: string;
  totalRooms: number;
  existingBlocks: Record<string, BlockDoc>;
}) {
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(() => plusDaysIso(0));
  const [blocked, setBlocked] = useState(0);
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

  const dates = Object.keys(existingBlocks).sort();

  return (
    <div className="space-y-5">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
          <label className="block text-xs">
            <span className="font-medium text-charcoal">
              Rooms to block (0 = unblock)
            </span>
            <input
              type="number"
              required
              min={0}
              max={totalRooms}
              value={blocked}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setBlocked(Number.isNaN(n) ? 0 : n);
              }}
              className="mt-1 w-full rounded-lg border border-border-warm bg-white px-3 py-2 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <span className="mt-1 block text-[10px] text-soft-gray">
              of {totalRooms} total
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

      <div className="border-t border-border-warm pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
          Current blocks (next 90 days)
        </h3>
        {dates.length === 0 ? (
          <p className="mt-2 text-xs text-soft-gray">
            No blocks set. All {totalRooms} rooms available subject to bookings.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border-warm">
            {dates.map((date) => {
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
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                          {b.blocked} blocked
                        </span>
                      )}
                      {b.held > 0 && (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-700">
                          {b.held} held
                        </span>
                      )}
                      {b.reason && <span className="italic">{b.reason}</span>}
                    </span>
                  </div>
                  {b.blocked > 0 && (
                    <UnblockButton slug={slug} date={date} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
