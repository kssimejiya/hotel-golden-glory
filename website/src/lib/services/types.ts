import type { RoomSlug, Booking, NewBooking, BookingStatus } from "@/types";

export interface AvailabilityService {
  check(input: {
    roomSlug: RoomSlug;
    checkIn: string;
    checkOut: string;
    rooms: number;
  }): Promise<{ available: boolean; remainingInventory: number; nights: number }>;
}

export interface PaymentService {
  createOrder(input: {
    amountInPaise: number;
    bookingId: string;
    receipt: string;
  }): Promise<{ orderId: string; razorpayKey: string }>;
  verifyPayment(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<{ verified: boolean }>;
}

export interface BookingRepository {
  create(booking: NewBooking): Promise<{ bookingId: string }>;
  getById(bookingId: string): Promise<Booking | null>;
  updateStatus(bookingId: string, status: BookingStatus): Promise<void>;
  list(): Promise<Booking[]>;
}

export interface NotificationService {
  sendGuestEmail(booking: Booking): Promise<{ sent: boolean }>;
  sendGuestSMS(booking: Booking): Promise<{ sent: boolean }>;
  sendHotelAlert(booking: Booking): Promise<{ sent: boolean }>;
}
