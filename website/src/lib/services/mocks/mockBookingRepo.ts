import type { BookingRepository } from "../types";
import type { Booking, NewBooking, BookingStatus } from "@/types";
import { generateBookingId } from "@/lib/booking/bookingId";

/**
 * Legacy in-memory mock — kept for reference and quick local testing.
 * The production wiring uses firestoreBookingRepo (see services/index.ts).
 */
const store = new Map<string, Booking>();

const CANCELLATION_POLICY =
  "Free cancellation up to 24 hours before check-in. Cancellations within 24 hours of check-in or no-shows will be charged one night's room rate.";

export const mockBookingRepo: BookingRepository = {
  async create(newBooking: NewBooking) {
    await new Promise((r) => setTimeout(r, 200));
    const bookingId = generateBookingId();
    const booking: Booking = {
      ...newBooking,
      bookingId,
      status: "awaiting_payment",
      createdAt: new Date().toISOString(),
      cancellationPolicy: CANCELLATION_POLICY,
    };
    store.set(bookingId, booking);
    return { bookingId };
  },

  async getById(bookingId: string) {
    await new Promise((r) => setTimeout(r, 100));
    return store.get(bookingId) ?? null;
  },

  async updateStatus(bookingId: string, status: BookingStatus) {
    await new Promise((r) => setTimeout(r, 100));
    const booking = store.get(bookingId);
    if (booking) {
      booking.status = status;
      store.set(bookingId, booking);
    }
  },

  async list() {
    await new Promise((r) => setTimeout(r, 100));
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
