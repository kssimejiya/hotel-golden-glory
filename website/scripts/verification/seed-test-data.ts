/**
 * Seed a known test booking in Firestore for verification.
 * Idempotent — re-running with the same TEST_BOOKING_ID skips creation.
 *
 * Usage:  npx tsx scripts/verification/seed-test-data.ts
 */
import { db } from "../lib/init-admin";
import { Timestamp } from "firebase-admin/firestore";

const TEST_BOOKING_ID = "BHG-TEST-0001";
const COLLECTION = "bookings";

const testBooking = {
  bookingId: TEST_BOOKING_ID,
  roomSlug: "deluxe" as const,
  mealPlan: "EP" as const,
  occupancy: "double" as const,
  dates: {
    checkIn: "2026-06-15",
    checkOut: "2026-06-17",
    nights: 2,
  },
  guests: {
    adults: 2,
    children: 0,
    rooms: 1,
  },
  pricing: {
    baseRate: 3499,
    nights: 2,
    rooms: 1,
    subtotal: 6998,
    taxes: 840,
    total: 7838,
  },
  guest: {
    fullName: "Test Guest Verification",
    email: "verify@example.com",
    phone: "+919876543210",
    specialRequests: "Verification test booking — safe to delete",
  },
  status: "confirmed" as const,
  createdAt: Timestamp.now(),
  cancellationPolicy:
    "Free cancellation up to 24 hours before check-in. Cancellations within 24 hours of check-in or no-shows will be charged one night's room rate.",
};

async function main() {
  const firestore = db();
  const docRef = firestore.collection(COLLECTION).doc(TEST_BOOKING_ID);
  const existing = await docRef.get();

  if (existing.exists) {
    console.log(`✓ Booking ${TEST_BOOKING_ID} already exists — skipping.`);
    console.log(`  Status: ${existing.data()?.status}`);
    console.log(`  Room: ${existing.data()?.roomSlug}`);
    console.log(`  Dates: ${existing.data()?.dates?.checkIn} → ${existing.data()?.dates?.checkOut}`);
    return;
  }

  await docRef.set(testBooking);
  console.log(`✓ Created test booking: ${TEST_BOOKING_ID}`);
  console.log(`  Room: ${testBooking.roomSlug}`);
  console.log(`  Dates: ${testBooking.dates.checkIn} → ${testBooking.dates.checkOut} (${testBooking.dates.nights} nights)`);
  console.log(`  Guest: ${testBooking.guest.fullName} <${testBooking.guest.email}>`);
  console.log(`  Status: ${testBooking.status}`);
  console.log(`  Total: ₹${testBooking.pricing.total.toLocaleString("en-IN")}`);
  console.log();
  console.log(`Verify in Firebase Console:`);
  console.log(`  Firestore → bookings → ${TEST_BOOKING_ID}`);
  console.log(`Verify in admin panel:`);
  console.log(`  http://localhost:3000/admin/bookings/${TEST_BOOKING_ID}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
