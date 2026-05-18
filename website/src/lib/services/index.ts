import type {
  PaymentService,
  BookingRepository,
  NotificationService,
} from "./types";
import { mockPayment } from "./mocks/mockPayment";
import { firestoreBookingRepo } from "./firestoreBookingRepo";
import { resendNotifications } from "./resendNotifications";

// NOTE: availabilityService is intentionally NOT exported here — it is
// backed by firebase-admin (server-only). Client components must use the
// `checkAvailabilityAction` server action in src/lib/booking/availability-actions.ts.
// Server code can import directly from `@/lib/firebase/availabilityRepo`.

// payment: still mocked — swap to real Razorpay Orders + signature verify in payment phase
export const paymentService: PaymentService = mockPayment;

// bookings: real Firestore-backed repo (collection: bookings/{bookingId})
export const bookingRepo: BookingRepository = firestoreBookingRepo;

// notifications: guest confirmation email is REAL (Resend) with graceful
// degradation to console + .email-previews/ when RESEND_API_KEY is unset.
// SMS and hotel-staff alert are still mocked — see resendNotifications.ts.
export const notifications: NotificationService = resendNotifications;
