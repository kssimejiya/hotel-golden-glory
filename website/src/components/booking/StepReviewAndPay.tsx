"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useBookingWizardStore } from "@/lib/booking/store";
import {
  createBookingAction,
  updateBookingStatusAction,
  notifyBookingConfirmedAction,
  createPaymentOrderAction,
  verifyPaymentAction,
} from "@/lib/booking/booking-flow-actions";
import { BookingSummaryCard } from "./BookingSummaryCard";
import type { NewBooking, Room } from "@/types";

// The payment dialog is only mounted when the user clicks Pay — defer its
// chunk so it doesn't ship with the review screen.
const MockRazorpayDialog = dynamic(
  () => import("./MockRazorpayDialog").then((m) => m.MockRazorpayDialog),
  { ssr: false }
);

interface StepReviewAndPayProps {
  onBack: () => void;
  rooms: Room[];
}

export function StepReviewAndPay({ onBack, rooms }: StepReviewAndPayProps) {
  const router = useRouter();
  const store = useBookingWizardStore();
  const {
    roomSlug,
    mealPlan,
    occupancy,
    dates,
    guests,
    pricing,
    guestDetails,
    setBookingId,
  } = store;

  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  // Two distinct empty-state renders depending on context:
  //   • If `processing` is true and data went missing, the user is mid-
  //     payment-success-flow. The wizard data shouldn't actually be missing
  //     at this point (reset now happens on the confirmation page, not
  //     here), but as a defensive net we render a processing loader instead
  //     of the "start over" message — that wording would be wrong and
  //     alarming for a user whose payment just succeeded.
  //   • If data is missing without processing, the user navigated directly
  //     to this step URL without filling the wizard; "start over" is the
  //     right message there.
  // Either branch narrows the destructured values to non-null below.
  if (!roomSlug || !dates || !pricing || !guestDetails) {
    if (processing) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="flex items-center gap-3 text-sm text-soft-gray">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            Finalising your booking…
          </span>
        </div>
      );
    }
    return (
      <div className="py-8 text-center text-sm text-soft-gray">
        Missing booking data. Please start over.
      </div>
    );
  }

  async function handlePay() {
    if (!roomSlug || !dates || !pricing || !guestDetails) return;
    setProcessing(true);
    setError(null);

    try {
      const newBooking: NewBooking = {
        roomSlug,
        mealPlan,
        occupancy,
        dates,
        guests,
        pricing,
        guest: guestDetails,
      };

      const { bookingId } = await createBookingAction(newBooking);
      setCurrentBookingId(bookingId);
      setBookingId(bookingId);

      await createPaymentOrderAction({
        amountInPaise: pricing.total * 100,
        bookingId,
        receipt: `receipt_${bookingId}`,
      });

      setProcessing(false);
      setShowPayment(true);
    } catch {
      setProcessing(false);
      setError("Something went wrong. Please try again.");
    }
  }

  async function handlePaymentSuccess(paymentId: string, signature: string) {
    if (!currentBookingId) return;
    setShowPayment(false);
    setProcessing(true);

    try {
      const { verified } = await verifyPaymentAction({
        orderId: `order_${currentBookingId}`,
        paymentId,
        signature,
      });

      if (verified) {
        await updateBookingStatusAction(currentBookingId, "confirmed");
        // Notifications are best-effort — a failed email must never roll back a
        // confirmed booking or block the guest from seeing their confirmation
        // page. notifyBookingConfirmedAction already uses Promise.allSettled
        // internally, but the extra try/catch here is belt-and-braces in case
        // a future implementation throws.
        try {
          await notifyBookingConfirmedAction(currentBookingId);
        } catch (notifyErr) {
          console.error(
            "[StepReviewAndPay] notification failed (booking is still confirmed):",
            notifyErr
          );
        }
        // Intentionally do NOT call store.reset() here. Resetting before
        // router.push completes causes this still-mounted component to
        // re-render with undefined wizard values and flash the "Missing
        // booking data" empty state for a frame before navigation lands on
        // the confirmation page. The confirmation page now owns the reset
        // (see confirmation-content.tsx's mount effect) — by that point this
        // component has unmounted, so the flash is impossible.
        router.push(`/booking/${currentBookingId}/confirmation`);
      } else {
        await updateBookingStatusAction(currentBookingId, "failed");
        router.push(`/booking/${currentBookingId}/failed`);
      }
    } catch {
      await updateBookingStatusAction(currentBookingId, "failed");
      router.push(`/booking/${currentBookingId}/failed`);
    }
  }

  async function handlePaymentFailure() {
    if (!currentBookingId) return;
    setShowPayment(false);
    await updateBookingStatusAction(currentBookingId, "failed");
    router.push(`/booking/${currentBookingId}/failed`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Review & Pay
        </h2>
        <p className="mt-1 text-sm text-soft-gray">
          Verify your booking details before payment.
        </p>
      </div>

      <BookingSummaryCard
        roomSlug={roomSlug}
        roomName={rooms.find((r) => r.slug === roomSlug)?.name}
        mealPlan={mealPlan}
        occupancy={occupancy}
        dates={dates}
        guests={guests}
        pricing={pricing}
      />

      {/* Guest details summary */}
      <div className="rounded-2xl border border-border-warm bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-charcoal">
          Guest Details
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-soft-gray">Name</dt>
            <dd className="font-medium text-charcoal">{guestDetails.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Email</dt>
            <dd className="font-medium text-charcoal">{guestDetails.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">Phone</dt>
            <dd className="font-medium text-charcoal">{guestDetails.phone}</dd>
          </div>
          {guestDetails.gstin && (
            <div className="flex justify-between">
              <dt className="text-soft-gray">GSTIN</dt>
              <dd className="font-medium text-charcoal">{guestDetails.gstin}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Cancellation policy */}
      <div className="rounded-xl bg-cream p-4">
        <p className="text-xs leading-relaxed text-soft-gray">
          <span className="font-semibold text-charcoal">Cancellation Policy: </span>
          Free cancellation up to 24 hours before check-in. Cancellations within
          24 hours or no-shows will be charged one night&apos;s room rate.
        </p>
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border-warm text-gold focus:ring-gold"
        />
        <span className="text-sm text-soft-gray">
          I agree to the booking terms and cancellation policy
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="flex-1 rounded-xl border border-border-warm py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!agreed || processing}
          className="flex-1 rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            `Pay ${pricing ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pricing.total) : ""}`
          )}
        </button>
      </div>

      {/* Mock Razorpay dialog */}
      {showPayment && currentBookingId && pricing && (
        <MockRazorpayDialog
          amount={pricing.total}
          bookingId={currentBookingId}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
