/**
 * Remove verification-seeded test data from Firestore.
 * Only deletes documents created by seed-test-data.ts.
 *
 * Usage:  npx tsx scripts/verification/clear-test-data.ts
 */
import { db } from "../lib/init-admin";

const TEST_BOOKING_ID = "BHG-TEST-0001";

async function main() {
  const firestore = db();

  // 1. Delete test booking
  const bookingRef = firestore.collection("bookings").doc(TEST_BOOKING_ID);
  const bookingSnap = await bookingRef.get();

  if (bookingSnap.exists) {
    await bookingRef.delete();
    console.log(`✓ Deleted test booking: ${TEST_BOOKING_ID}`);
  } else {
    console.log(`  Booking ${TEST_BOOKING_ID} not found — nothing to delete.`);
  }

  // 2. Delete any availability blocks for the test booking's dates
  const testDates = ["2026-06-15", "2026-06-16"];
  const testSlug = "deluxe";
  let blocksDeleted = 0;

  for (const date of testDates) {
    const blockRef = firestore
      .collection("availability")
      .doc(`${testSlug}_${date}`);
    const blockSnap = await blockRef.get();
    if (blockSnap.exists) {
      const data = blockSnap.data();
      // Only delete if it looks like test data (no real admin would block these specific test dates)
      if (data?.reason?.includes("verification") || data?.reason?.includes("test")) {
        await blockRef.delete();
        blocksDeleted++;
      }
    }
  }

  if (blocksDeleted > 0) {
    console.log(`✓ Deleted ${blocksDeleted} test availability block(s).`);
  }

  console.log("\n✓ Test data cleanup complete.");
  console.log("  Note: bookings created through the UI are NOT affected.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
