"use server";

import { bookingRepo, paymentService, notifications } from "@/lib/services";
import { adminDb } from "@/lib/firebase/admin";

interface VerifyInput {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

type VerifyResult =
  | { ok: true; status: "confirmed" }
  | { ok: false; status: "failed" | "cancelled" | "not_found" | "already_confirmed" };

export async function verifyPaymentAndConfirm(
  input: VerifyInput
): Promise<VerifyResult> {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    input;

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return { ok: false, status: "not_found" };
  }

  // Idempotency: already confirmed → return success
  if (booking.status === "confirmed") {
    return { ok: true, status: "confirmed" };
  }

  // Verify signature FIRST — signature validity is the source of truth.
  // A valid signature means Razorpay captured the payment regardless of
  // what local status says (race with ondismiss can cause wrongful cancel).
  const { verified } = await paymentService.verifyPayment({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!verified) {
    if (booking.status === "awaiting_payment") {
      await bookingRepo.updateStatus(bookingId, "failed");
    }
    return { ok: false, status: "failed" };
  }

  // Signature valid — payment is real. Confirm regardless of current status.
  // This rescues bookings wrongly cancelled by a stale ondismiss race.
  if (booking.status === "cancelled") {
    console.warn(
      `[verifyPaymentAndConfirm] RECOVERY: booking ${bookingId} was cancelled but payment verified — rescuing to confirmed`
    );
  }

  await adminDb()
    .collection("bookings")
    .doc(bookingId)
    .update({
      status: "confirmed",
      paymentId: razorpayPaymentId,
      paymentOrderId: razorpayOrderId,
    });

  // Notifications are best-effort — never reverse a confirmed booking
  try {
    const confirmedBooking = await bookingRepo.getById(bookingId);
    if (confirmedBooking) {
      await notifications.sendGuestEmail(confirmedBooking);
      await notifications.sendHotelAlert(confirmedBooking);
    }
  } catch (notifyErr) {
    console.error(
      `[verifyPaymentAndConfirm] notification failed for ${bookingId} (booking is confirmed):`,
      notifyErr
    );
  }

  return { ok: true, status: "confirmed" };
}

export async function cancelAbandonedBooking(
  bookingId: string
): Promise<void> {
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return;

  if (booking.status !== "awaiting_payment") {
    console.log(
      `[cancelAbandonedBooking] skipped ${bookingId} — status is already '${booking.status}'`
    );
    return;
  }

  await bookingRepo.updateStatus(bookingId, "cancelled");
  console.log(`[cancelAbandonedBooking] cancelled ${bookingId}`);
}
