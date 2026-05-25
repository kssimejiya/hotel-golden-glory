"use server";

import { bookingRepo, notifications, paymentService } from "@/lib/services";
import { firestoreAvailability } from "@/lib/firebase/availabilityRepo";
import type { Booking, BookingStatus, NewBooking } from "@/types";

/**
 * Server-action wrappers around the (server-only) Firestore booking repo.
 * Client components in the booking wizard / confirmation pages call these
 * instead of importing the repo directly.
 */

export async function createBookingAction(
  newBooking: NewBooking
): Promise<{ bookingId: string }> {
  const { available } = await firestoreAvailability.check({
    roomSlug: newBooking.roomSlug,
    checkIn: newBooking.dates.checkIn,
    checkOut: newBooking.dates.checkOut,
    rooms: newBooking.guests.rooms,
  });

  if (!available) {
    throw new Error(
      "This room is no longer available for your selected dates. Please go back and choose a different room or dates."
    );
  }

  return bookingRepo.create(newBooking);
}

export async function getBookingAction(
  bookingId: string
): Promise<Booking | null> {
  return bookingRepo.getById(bookingId);
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await bookingRepo.updateStatus(bookingId, status);
}

/**
 * Payment server-action wrappers. Currently delegate to the mock; when the
 * real Razorpay integration lands, both call sites already speak server-only
 * — no client refactor will be needed.
 */
export async function createPaymentOrderAction(input: {
  amountInPaise: number;
  bookingId: string;
  receipt: string;
}): Promise<{ orderId: string; razorpayKey: string }> {
  return paymentService.createOrder(input);
}

export async function verifyPaymentAction(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ verified: boolean }> {
  return paymentService.verifyPayment(input);
}

/**
 * Fire all guest-facing + hotel-facing notifications for a confirmed booking.
 * Loads the freshest booking from Firestore so the templates render with the
 * current status. Notifications are currently mocked — see services/index.ts.
 */
export async function notifyBookingConfirmedAction(
  bookingId: string
): Promise<{ sent: boolean }> {
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { sent: false };
  const results = await Promise.allSettled([
    notifications.sendGuestEmail(booking),
    // SMS notifications are disabled for now — no provider is wired up
    // (sendGuestSMS is a console.log mock). Re-enable once a real SMS
    // provider is integrated and a corresponding template is approved.
    // notifications.sendGuestSMS(booking),
    notifications.sendHotelAlert(booking),
  ]);
  // sent === true only if every channel succeeded.
  const ok = results.every(
    (r) => r.status === "fulfilled" && r.value.sent === true
  );
  return { sent: ok };
}
