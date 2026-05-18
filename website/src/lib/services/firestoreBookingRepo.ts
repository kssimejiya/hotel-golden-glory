import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { generateBookingId } from "@/lib/booking/bookingId";
import type { BookingRepository } from "./types";
import type { Booking, BookingStatus, NewBooking } from "@/types";

/**
 * Firestore-backed BookingRepository.
 * Collection: bookings/{bookingId}
 * createdAt is stored as a server Timestamp for accurate ordering across timezones.
 * The Booking type's createdAt is an ISO string — we convert on read.
 */
const COLLECTION = "bookings";

const CANCELLATION_POLICY =
  "Free cancellation up to 24 hours before check-in. Cancellations within 24 hours of check-in or no-shows will be charged one night's room rate.";

interface StoredBooking extends Omit<Booking, "createdAt"> {
  createdAt: Timestamp | string;
}

function fromDoc(data: StoredBooking): Booking {
  const { createdAt, ...rest } = data;
  const createdAtIso =
    createdAt instanceof Timestamp
      ? createdAt.toDate().toISOString()
      : typeof createdAt === "string"
        ? createdAt
        : new Date().toISOString();
  return { ...(rest as Omit<Booking, "createdAt">), createdAt: createdAtIso };
}

export const firestoreBookingRepo: BookingRepository = {
  async create(newBooking: NewBooking) {
    const bookingId = generateBookingId();
    const docData = {
      ...newBooking,
      bookingId,
      status: "awaiting_payment" as BookingStatus,
      createdAt: Timestamp.now(),
      cancellationPolicy: CANCELLATION_POLICY,
    };
    try {
      await adminDb().collection(COLLECTION).doc(bookingId).set(docData);
    } catch (err) {
      console.error("[firestoreBookingRepo] create failed:", err);
      throw new Error("Failed to create booking — please try again.");
    }
    return { bookingId };
  },

  async getById(bookingId: string) {
    try {
      const snap = await adminDb().collection(COLLECTION).doc(bookingId).get();
      if (!snap.exists) return null;
      return fromDoc(snap.data() as StoredBooking);
    } catch (err) {
      console.error(`[firestoreBookingRepo] getById(${bookingId}) failed:`, err);
      return null;
    }
  },

  async updateStatus(bookingId: string, status: BookingStatus) {
    try {
      await adminDb()
        .collection(COLLECTION)
        .doc(bookingId)
        .update({ status });
    } catch (err) {
      console.error(
        `[firestoreBookingRepo] updateStatus(${bookingId}, ${status}) failed:`,
        err
      );
      throw new Error("Failed to update booking status.");
    }
  },

  async list() {
    try {
      const snap = await adminDb()
        .collection(COLLECTION)
        .orderBy("createdAt", "desc")
        .get();
      return snap.docs.map((d) => fromDoc(d.data() as StoredBooking));
    } catch (err) {
      console.error("[firestoreBookingRepo] list failed:", err);
      return [];
    }
  },
};
