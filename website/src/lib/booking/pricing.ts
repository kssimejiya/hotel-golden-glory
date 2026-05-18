import type { Room, MealPlan, Occupancy, BookingPricing } from "@/types";

function getGstRate(perNightRate: number): number {
  // Indian hotel GST: 12% up to ₹7,499/night, 18% at ₹7,500+
  return perNightRate >= 7500 ? 0.18 : 0.12;
}

/**
 * Pure pricing function. The caller passes in the live Room object so the
 * calculation reflects any Firestore rate overrides (admin RateEditor).
 * NEVER reach back into static content.ts from here — that re-introduces
 * the "rates edited in admin but bookings priced from defaults" bug.
 */
export function calculatePricing(
  room: Room,
  mealPlan: MealPlan,
  occupancy: Occupancy,
  nights: number,
  rooms: number
): BookingPricing {
  const rate = room.rates.find((r) => r.plan === mealPlan);
  if (!rate) {
    throw new Error(`Rate not found for plan: ${mealPlan} on room ${room.slug}`);
  }

  const baseRate = occupancy === "single" ? rate.single : rate.double;
  const subtotal = baseRate * nights * rooms;
  const gstRate = getGstRate(baseRate);
  const taxes = Math.round(subtotal * gstRate);
  const total = subtotal + taxes;

  return { baseRate, nights, rooms, subtotal, taxes, total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}
