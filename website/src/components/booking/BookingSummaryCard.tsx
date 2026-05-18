import type {
  BookingPricing,
  MealPlan,
  Occupancy,
  BookingDates,
  BookingGuests,
} from "@/types";
import { mealPlanLabels } from "@/lib/content";
import { formatDate } from "@/lib/booking/pricing";
import { PriceBreakdown } from "./PriceBreakdown";

interface BookingSummaryCardProps {
  roomSlug: string;
  /** Display name for the room. Optional — falls back to the slug. */
  roomName?: string;
  mealPlan: MealPlan;
  occupancy: Occupancy;
  dates: BookingDates;
  guests: BookingGuests;
  pricing: BookingPricing;
  className?: string;
}

export function BookingSummaryCard({
  roomSlug,
  roomName,
  mealPlan,
  occupancy,
  dates,
  guests,
  pricing,
  className,
}: BookingSummaryCardProps) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-border-warm bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-charcoal">
          Booking Summary
        </h3>
        <div className="mt-1 h-0.5 w-8 bg-gold" />

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-soft-gray">Room</dt>
            <dd className="font-medium text-charcoal">{roomName ?? roomSlug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Plan</dt>
            <dd className="font-medium text-charcoal">
              {mealPlanLabels[mealPlan]?.short ?? mealPlan}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Occupancy</dt>
            <dd className="font-medium capitalize text-charcoal">{occupancy}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Check-in</dt>
            <dd className="font-medium text-charcoal">{formatDate(dates.checkIn)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Check-out</dt>
            <dd className="font-medium text-charcoal">{formatDate(dates.checkOut)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Duration</dt>
            <dd className="font-medium text-charcoal">
              {dates.nights} night{dates.nights > 1 ? "s" : ""}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Guests</dt>
            <dd className="font-medium text-charcoal">
              {guests.adults} adult{guests.adults > 1 ? "s" : ""}
              {guests.children > 0 &&
                `, ${guests.children} child${guests.children > 1 ? "ren" : ""}`}
            </dd>
          </div>
          {guests.rooms > 1 && (
            <div className="flex justify-between">
              <dt className="text-soft-gray">Rooms</dt>
              <dd className="font-medium text-charcoal">{guests.rooms}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 border-t border-border-warm pt-4">
          <PriceBreakdown pricing={pricing} />
        </div>
      </div>
    </div>
  );
}
