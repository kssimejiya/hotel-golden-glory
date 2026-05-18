"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useBookingWizardStore } from "@/lib/booking/store";
import { mealPlanLabels } from "@/lib/content";
import { checkAvailabilityAction } from "@/lib/booking/availability-actions";
import { calculatePricing, formatCurrency } from "@/lib/booking/pricing";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { PriceBreakdown } from "./PriceBreakdown";
import type { RoomSlug, MealPlan, Room } from "@/types";

interface StepRoomAndPlanProps {
  rooms: Room[];
  onNext: () => void;
  onBack: () => void;
}

interface AvailabilityState {
  loading: boolean;
  available: boolean;
  remaining: number;
}

const plans: MealPlan[] = ["EP", "CP", "MAP"];

export function StepRoomAndPlan({ rooms, onNext, onBack }: StepRoomAndPlanProps) {
  const {
    dates,
    guests,
    roomSlug,
    mealPlan,
    occupancy,
    setRoom,
    setMealPlan,
    setOccupancy,
    setPricing,
  } = useBookingWizardStore();

  const [availability, setAvailability] = useState<
    Record<string, AvailabilityState>
  >({});

  const checkIn = dates?.checkIn ?? "";
  const checkOut = dates?.checkOut ?? "";
  const roomCount = guests.rooms;

  useEffect(() => {
    if (!checkIn || !checkOut) return;

    let cancelled = false;

    async function fetchAvailability() {
      const results = await Promise.all(
        rooms.map(async (room) => {
          try {
            const result = await checkAvailabilityAction({
              roomSlug: room.slug,
              checkIn,
              checkOut,
              rooms: roomCount,
            });
            return {
              slug: room.slug,
              state: {
                loading: false,
                available: result.available,
                remaining: result.remainingInventory,
              } as AvailabilityState,
            };
          } catch {
            return {
              slug: room.slug,
              state: { loading: false, available: false, remaining: 0 } as AvailabilityState,
            };
          }
        })
      );

      if (!cancelled) {
        const map: Record<string, AvailabilityState> = {};
        for (const r of results) map[r.slug] = r.state;
        setAvailability(map);
      }
    }

    fetchAvailability();

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, roomCount, rooms]);

  useEffect(() => {
    const occ = guests.adults === 1 ? "single" : "double";
    if (occ !== occupancy) {
      setOccupancy(occ);
    }
  }, [guests.adults, occupancy, setOccupancy]);

  function handleSelectRoom(slug: RoomSlug) {
    const avail = availability[slug];
    if (avail && !avail.available && !avail.loading) return;
    setRoom(slug);
  }

  const selectedRoom = roomSlug ? rooms.find((r) => r.slug === roomSlug) : null;

  function handleContinue() {
    if (!selectedRoom || !dates) return;
    const pricing = calculatePricing(
      selectedRoom,
      mealPlan,
      occupancy,
      dates.nights,
      guests.rooms
    );
    setPricing(pricing);
    onNext();
  }

  const previewPricing =
    selectedRoom && dates
      ? calculatePricing(selectedRoom, mealPlan, occupancy, dates.nights, guests.rooms)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Choose your room
        </h2>
        <p className="mt-1 text-sm text-soft-gray">
          Select a room category and meal plan.
        </p>
      </div>

      {/* Room cards */}
      <div className="space-y-3">
        {rooms.map((room) => {
          const avail = availability[room.slug];
          const isSelected = roomSlug === room.slug;
          const isSoldOut = avail && !avail.available && !avail.loading;
          return (
            <button
              key={room.slug}
              type="button"
              onClick={() => handleSelectRoom(room.slug)}
              disabled={isSoldOut}
              className={cn(
                "w-full rounded-2xl border-2 bg-white p-4 text-left transition-all",
                isSelected
                  ? "border-gold shadow-md"
                  : "border-transparent shadow-sm hover:border-gold/30",
                isSoldOut && "cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex gap-4">
                <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                  <SmartImage
                    image={resolveHeroImage(room)}
                    alt={room.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold text-charcoal">
                        {room.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-soft-gray">
                        {room.sqft} sqft · {room.bedConfiguration}
                      </p>
                    </div>
                    {/* Show the rate that *actually applies* given the
                        user's adult count (single vs double occupancy), not
                        a hardcoded single rate. "from" signals it's the
                        cheapest meal plan (EP) — switching to CP or MAP
                        adjusts the rate upward, and GST is added on top. */}
                    <div className="shrink-0 text-right">
                      <p className="font-body text-sm font-semibold text-gold">
                        from{" "}
                        {formatCurrency(
                          occupancy === "single"
                            ? room.rates[0].single
                            : room.rates[0].double
                        )}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-[0.1em] text-soft-gray">
                        / night
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <AvailabilityBadge
                      available={avail?.available ?? false}
                      remaining={avail?.remaining ?? 0}
                      loading={avail?.loading ?? true}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Meal plan tabs */}
      {roomSlug && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-charcoal">Meal Plan</h3>
          <div className="flex gap-1 rounded-xl bg-cream p-1">
            {plans.map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => setMealPlan(plan)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                  mealPlan === plan
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-soft-gray hover:text-charcoal"
                )}
              >
                {mealPlanLabels[plan].short}
              </button>
            ))}
          </div>
          <p className="text-xs text-soft-gray">
            {mealPlanLabels[mealPlan].full} · {occupancy === "single" ? "Single" : "Double"} occupancy
          </p>

          {/* Transparent price breakdown — addresses "why is my total so much
              higher than the per-night rate I saw on the card?" by showing
              exactly which rate is being applied, how nights/rooms multiply
              it, and how GST stacks on top. The math was always correct; it
              just wasn't visible until the final review step. */}
          {previewPricing && (
            <div className="rounded-2xl border border-border-warm bg-white p-4">
              <PriceBreakdown pricing={previewPricing} />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-border-warm py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!roomSlug}
          className="flex-1 rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
