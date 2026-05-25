/**
 * Recover a booking that was wrongly cancelled due to the ondismiss race bug.
 *
 * Usage:
 *   npx tsx scripts/recover-booking.ts <bookingId>
 *
 * What it does:
 *   1. Fetches the booking from Firestore
 *   2. Checks with Razorpay API whether the order's payment was captured
 *   3. If payment is captured, updates booking status to 'confirmed' and
 *      stores the paymentId/paymentOrderId
 *   4. Optionally fires the notification email
 *
 * Safe to re-run — idempotent (won't re-confirm an already confirmed booking).
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "./lib/init-admin";
import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local");
  process.exit(1);
}

const rzp = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

async function main() {
  const bookingId = process.argv[2];
  if (!bookingId) {
    console.error("Usage: npx tsx scripts/recover-booking.ts <bookingId>");
    process.exit(1);
  }

  console.log(`\nRecovering booking: ${bookingId}`);
  console.log("─".repeat(50));

  const bookingRef = db().collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();

  if (!snap.exists) {
    console.error(`Booking ${bookingId} not found in Firestore.`);
    process.exit(1);
  }

  const booking = snap.data()!;
  console.log(`Current status: ${booking.status}`);
  console.log(`Room: ${booking.roomSlug}, Dates: ${booking.dates?.checkIn} → ${booking.dates?.checkOut}`);
  console.log(`Guest: ${booking.guest?.fullName} (${booking.guest?.email})`);
  console.log(`Total: ₹${booking.pricing?.total}`);

  if (booking.status === "confirmed") {
    console.log("\n✓ Booking is already confirmed — nothing to do.");
    process.exit(0);
  }

  // Find the Razorpay order associated with this booking
  // Try paymentOrderId first, then search by notes
  let orderId = booking.paymentOrderId;

  if (!orderId) {
    console.log("\nSearching Razorpay for order with bookingId in notes...");
    try {
      const orders = await rzp.orders.all({
        receipt: `receipt_${bookingId}`,
      });
      if (orders.items && orders.items.length > 0) {
        orderId = orders.items[0].id;
        console.log(`Found order: ${orderId}`);
      }
    } catch (err) {
      console.error("Failed to search orders:", err);
    }
  }

  if (!orderId) {
    console.error("\nCould not find Razorpay order for this booking.");
    console.error("You may need to look it up manually in Razorpay Dashboard.");
    process.exit(1);
  }

  // Fetch order details
  console.log(`\nFetching Razorpay order: ${orderId}`);
  const order = await rzp.orders.fetch(orderId);
  console.log(`Order status: ${order.status}`);
  console.log(`Order amount: ₹${Number(order.amount) / 100}`);

  if (order.status !== "paid") {
    console.error(`\nOrder is not paid (status: ${order.status}). Cannot recover.`);
    console.error("Check Razorpay Dashboard for payment details.");
    process.exit(1);
  }

  // Fetch payments for this order
  const payments = await rzp.orders.fetchPayments(orderId);
  const capturedPayment = (payments as { items?: Array<{ id: string; status: string }> }).items?.find(
    (p: { status: string }) => p.status === "captured"
  );

  if (!capturedPayment) {
    console.error("\nNo captured payment found for this order.");
    process.exit(1);
  }

  console.log(`\nCaptured payment: ${capturedPayment.id}`);

  // Recover — update booking to confirmed
  console.log("\nUpdating booking to confirmed...");
  await bookingRef.update({
    status: "confirmed",
    paymentId: capturedPayment.id,
    paymentOrderId: orderId,
  });

  console.log("\n✓ Booking recovered successfully!");
  console.log(`  Status: confirmed`);
  console.log(`  Payment ID: ${capturedPayment.id}`);
  console.log(`  Order ID: ${orderId}`);
  console.log(`\nNote: Notification email was not re-sent. Send manually if needed.`);
}

main().catch((err) => {
  console.error("\nUnexpected error:", err);
  process.exit(1);
});
