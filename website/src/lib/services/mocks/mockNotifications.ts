import type { NotificationService } from "../types";
import type { Booking } from "@/types";

export const mockNotifications: NotificationService = {
  async sendGuestEmail(booking: Booking) {
    console.log("[MOCK EMAIL] Guest confirmation:", {
      to: booking.guest.email,
      subject: `Booking Confirmed — ${booking.bookingId}`,
      room: booking.roomSlug,
      checkIn: booking.dates.checkIn,
      checkOut: booking.dates.checkOut,
      total: booking.pricing.total,
    });
    return { sent: true };
  },

  async sendGuestSMS(booking: Booking) {
    console.log("[MOCK SMS] Guest confirmation:", {
      to: booking.guest.phone,
      message: `Your booking ${booking.bookingId} at The Blues Hotel Golden Glory is confirmed. Check-in: ${booking.dates.checkIn}. Total: ₹${booking.pricing.total}`,
    });
    return { sent: true };
  },

  async sendHotelAlert(booking: Booking) {
    console.log("[MOCK HOTEL ALERT] New booking:", {
      bookingId: booking.bookingId,
      guest: booking.guest.fullName,
      room: booking.roomSlug,
      checkIn: booking.dates.checkIn,
      checkOut: booking.dates.checkOut,
      nights: booking.dates.nights,
      total: booking.pricing.total,
    });
    return { sent: true };
  },
};
