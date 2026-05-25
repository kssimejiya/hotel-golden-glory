"use server";

import { firestoreAvailability } from "@/lib/firebase/availabilityRepo";
import { roomRepo } from "@/lib/firebase/roomRepo";
import { bookingRepo, paymentService } from "@/lib/services";
import { calculatePricing } from "@/lib/booking/pricing";
import type {
  RoomSlug,
  MealPlan,
  Occupancy,
  BookingDates,
  BookingGuests,
  BookingPricing,
  GuestDetails,
} from "@/types";

interface FinalizeInput {
  roomSlug: RoomSlug;
  mealPlan: MealPlan;
  occupancy: Occupancy;
  dates: BookingDates;
  guests: BookingGuests;
  guest: GuestDetails;
  expectedTotal: number;
}

type FinalizeResult =
  | {
      ok: true;
      bookingId: string;
      razorpayOrderId: string;
      razorpayKey: string;
      amountInPaise: number;
    }
  | {
      ok: false;
      reason: "no_longer_available";
      remaining: number;
    }
  | {
      ok: false;
      reason: "insufficient_inventory";
      remaining: number;
    }
  | {
      ok: false;
      reason: "price_changed";
      newPricing: BookingPricing;
    }
  | {
      ok: false;
      reason: "room_not_found";
    };

export async function finalizeBookingForPayment(
  input: FinalizeInput
): Promise<FinalizeResult> {
  const { roomSlug, mealPlan, occupancy, dates, guests, guest, expectedTotal } =
    input;

  // (a) Re-check availability against current Firestore state
  const { available, remainingInventory } = await firestoreAvailability.check({
    roomSlug,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    rooms: guests.rooms,
  });

  if (!available) {
    if (remainingInventory === 0) {
      return { ok: false, reason: "no_longer_available", remaining: 0 };
    }
    return {
      ok: false,
      reason: "insufficient_inventory",
      remaining: remainingInventory,
    };
  }

  // (b) Re-compute pricing server-side from live room data
  const room = await roomRepo.getBySlug(roomSlug);
  if (!room) {
    return { ok: false, reason: "room_not_found" };
  }

  const serverPricing = calculatePricing(
    room,
    mealPlan,
    occupancy,
    dates.nights,
    guests.rooms
  );

  if (serverPricing.total !== expectedTotal) {
    return { ok: false, reason: "price_changed", newPricing: serverPricing };
  }

  // (c) Create booking with awaiting_payment using SERVER-computed pricing
  const { bookingId } = await bookingRepo.create({
    roomSlug,
    mealPlan,
    occupancy,
    dates,
    guests,
    pricing: serverPricing,
    guest,
  });

  // (d) Create Razorpay order using server-computed amount
  const amountInPaise = serverPricing.total * 100;
  const { orderId, razorpayKey } = await paymentService.createOrder({
    amountInPaise,
    bookingId,
    receipt: `receipt_${bookingId}`,
  });

  return {
    ok: true,
    bookingId,
    razorpayOrderId: orderId,
    razorpayKey,
    amountInPaise,
  };
}
