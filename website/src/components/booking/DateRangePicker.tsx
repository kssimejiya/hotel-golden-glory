"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/booking/pricing";

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
}

/**
 * Format a Date as `YYYY-MM-DD` using its **local** components.
 *
 * Important: `date.toISOString()` returns UTC. For any timezone east of UTC
 * (IST, SGT, JST, AEST…), a Date representing local midnight on day N is
 * stored as `N-1 18:30:00.000Z`, so `toISOString().split("T")[0]` returns
 * the *previous* day. Picking May 21 in IST would round-trip to May 20.
 * Using getFullYear/getMonth/getDate uses local-time values and avoids the
 * shift entirely.
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a `YYYY-MM-DD` date-only string as local midnight. `new Date("2026-
 * 05-21")` parses as UTC midnight per spec, which then displays as the
 * previous day in any east-of-UTC timezone. Appending `T00:00:00` forces
 * the parser to treat it as local time.
 */
function parseDateString(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
}: DateRangePickerProps) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 365);

  const checkInDate = checkIn ? parseDateString(checkIn) : undefined;
  const minCheckOut = checkInDate
    ? new Date(checkInDate.getTime() + 86400000)
    : new Date(today.getTime() + 86400000);
  const maxCheckOut = checkInDate
    ? new Date(checkInDate.getTime() + 30 * 86400000)
    : maxDate;
  const checkOutDate = checkOut ? parseDateString(checkOut) : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Check-in */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-charcoal">
          Check-in
        </label>
        <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
          <PopoverTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border border-border-warm bg-white px-4 py-3 text-base transition-colors hover:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm",
              !checkIn && "text-soft-gray"
            )}
          >
            <CalendarIcon className="h-4 w-4 text-gold" />
            {checkIn ? formatDate(checkIn) : "Select date"}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={checkInDate}
              onSelect={(date) => {
                if (date) {
                  const ds = toDateString(date);
                  onCheckInChange(ds);
                  // Compare apples to apples: parse the stored check-out
                  // string as local midnight, same as the picker's `date`.
                  if (checkOut && parseDateString(checkOut) <= date) {
                    const nextDay = new Date(date.getTime() + 86400000);
                    onCheckOutChange(toDateString(nextDay));
                  }
                  setCheckInOpen(false);
                }
              }}
              disabled={{ before: today }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Check-out */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-charcoal">
          Check-out
        </label>
        <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <PopoverTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border border-border-warm bg-white px-4 py-3 text-base transition-colors hover:border-gold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold/30 sm:text-sm",
              !checkOut && "text-soft-gray"
            )}
          >
            <CalendarIcon className="h-4 w-4 text-gold" />
            {checkOut ? formatDate(checkOut) : "Select date"}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={checkOutDate}
              onSelect={(date) => {
                if (date) {
                  onCheckOutChange(toDateString(date));
                  setCheckOutOpen(false);
                }
              }}
              disabled={{ before: minCheckOut, after: maxCheckOut }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
