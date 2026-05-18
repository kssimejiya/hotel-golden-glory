"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookingButton } from "@/components/shared/BookingButton";
import { hotelInfo, mealPlanLabels } from "@/lib/content";
import type { RoomRate, MealPlan } from "@/types";

interface RoomRateCardProps {
  rates: RoomRate[];
  slug: string;
}

const plans: MealPlan[] = ["EP", "CP", "MAP"];

export function RoomRateCard({ rates, slug }: RoomRateCardProps) {
  const [activePlan, setActivePlan] = useState<MealPlan>("EP");
  const activeRate = rates.find((r) => r.plan === activePlan)!;

  // p-4 on mobile (vs p-6 on tablet+) keeps the card's content extending
  // close to the card edge — the hero image above has *no* internal padding
  // (the photo fills its box), so the previous p-6 made the card content
  // visually ~24px narrower than the image content on each side, which read
  // as "the card is smaller than the image." Reduced padding on mobile closes
  // that gap while preserving generous premium breathing room on tablet/
  // desktop where the card lives in a sidebar.
  return (
    <div className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-[100px]">
      {/* Heading — centered, premium hotel rate-card convention */}
      <h3 className="text-center font-display text-lg font-semibold text-charcoal">
        Room Rates
      </h3>
      <div className="mx-auto mt-1 h-0.5 w-10 bg-gold" />

      {/* Plan tabs — full-width 3-way segmented control */}
      <div className="mt-5 flex gap-1 rounded-xl bg-cream p-1">
        {plans.map((plan) => (
          <button
            key={plan}
            onClick={() => setActivePlan(plan)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
              activePlan === plan
                ? "bg-white text-charcoal shadow-sm"
                : "text-soft-gray hover:text-charcoal"
            )}
          >
            {mealPlanLabels[plan].short}
          </button>
        ))}
      </div>

      {/* Rates — symmetric 2-column grid with a hairline gold divider between
          Single and Double. Each column is a vertical stack (LABEL → ₹VALUE
          → per night) so the eye reads price first, occupancy as context.
          The divider is a subtle premium signal — two columns implying a
          single choice. */}
      <div className="relative mt-6 grid grid-cols-2 gap-2">
        <div
          aria-hidden="true"
          className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-border-warm"
        />
        <div className="text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-gray">
            Single
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-charcoal">
            ₹{activeRate.single.toLocaleString("en-IN")}
          </p>
          <p className="mt-1.5 text-[0.7rem] text-soft-gray">per night</p>
        </div>
        <div className="text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-gray">
            Double
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-charcoal">
            ₹{activeRate.double.toLocaleString("en-IN")}
          </p>
          <p className="mt-1.5 text-[0.7rem] text-soft-gray">per night</p>
        </div>
      </div>

      {/* Fine print — centered to keep the card's vertical axis of symmetry */}
      <p className="mt-5 text-center text-xs leading-relaxed text-soft-gray">
        Taxes as applicable. Check-in {hotelInfo.checkIn} · Check-out{" "}
        {hotelInfo.checkOut}
      </p>

      {/* CTA */}
      <div className="mt-6">
        <BookingButton
          variant="gold"
          size="lg"
          href={`/booking?room=${slug}&plan=${activePlan}`}
          className="w-full justify-center"
        >
          Check Availability
        </BookingButton>
      </div>

      {/* Plan full name */}
      <p className="mt-3 text-center text-xs text-soft-gray">
        {mealPlanLabels[activePlan].full}
      </p>
    </div>
  );
}
