"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useBookingWizardStore } from "@/lib/booking/store";
import { finalizeBookingForPayment } from "@/lib/booking/finalize-actions";
import {
  verifyPaymentAndConfirm,
  cancelAbandonedBooking,
} from "@/lib/booking/verify-actions";
import { formatCurrency } from "@/lib/booking/pricing";
import { BookingSummaryCard } from "./BookingSummaryCard";
import type { BookingPricing, Room } from "@/types";

const RazorpayCheckout = dynamic(
  () => import("./RazorpayCheckout").then((m) => m.RazorpayCheckout),
  { ssr: false }
);

interface StepReviewAndPayProps {
  onBack: () => void;
  rooms: Room[];
}

type FailureState =
  | { type: "no_longer_available" }
  | { type: "insufficient_inventory"; remaining: number }
  | { type: "price_changed"; newPricing: BookingPricing }
  | { type: "payment_cancelled" }
  | { type: "generic"; message: string };

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
    setPricing,
  } = store;

  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<FailureState | null>(null);

  // Razorpay checkout state
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    razorpayKey: string;
    amountInPaise: number;
    bookingId: string;
  } | null>(null);

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

  const roomName =
    rooms.find((r) => r.slug === roomSlug)?.name ?? roomSlug;

  async function handlePay() {
    if (!roomSlug || !dates || !pricing || !guestDetails) return;
    setProcessing(true);
    setFailure(null);

    try {
      const result = await finalizeBookingForPayment({
        roomSlug,
        mealPlan,
        occupancy,
        dates,
        guests,
        guest: guestDetails,
        expectedTotal: pricing.total,
      });

      if (!result.ok) {
        setProcessing(false);
        switch (result.reason) {
          case "no_longer_available":
            setFailure({ type: "no_longer_available" });
            return;
          case "insufficient_inventory":
            setFailure({
              type: "insufficient_inventory",
              remaining: result.remaining,
            });
            return;
          case "price_changed":
            setFailure({ type: "price_changed", newPricing: result.newPricing });
            return;
          case "room_not_found":
            setFailure({ type: "generic", message: "Room not found. Please go back and select again." });
            return;
        }
      }

      setBookingId(result.bookingId);
      setCheckoutData({
        orderId: result.razorpayOrderId,
        razorpayKey: result.razorpayKey,
        amountInPaise: result.amountInPaise,
        bookingId: result.bookingId,
      });
      setProcessing(false);
    } catch (err) {
      setProcessing(false);
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFailure({ type: "generic", message });
    }
  }

  async function handlePaymentSuccess(response: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) {
    if (!checkoutData) return;
    setCheckoutData(null);
    setProcessing(true);

    try {
      const result = await verifyPaymentAndConfirm({
        bookingId: checkoutData.bookingId,
        razorpayOrderId: response.razorpayOrderId,
        razorpayPaymentId: response.razorpayPaymentId,
        razorpaySignature: response.razorpaySignature,
      });

      if (result.ok) {
        router.push(`/booking/${checkoutData.bookingId}/confirmation`);
      } else {
        router.push(`/booking/${checkoutData.bookingId}/failed`);
      }
    } catch {
      router.push(`/booking/${checkoutData.bookingId}/failed`);
    }
  }

  async function handlePaymentDismiss() {
    if (checkoutData) {
      await cancelAbandonedBooking(checkoutData.bookingId);
      setCheckoutData(null);
      setFailure({ type: "payment_cancelled" });
    }
  }

  function handleAcceptNewPrice(newPricing: BookingPricing) {
    setPricing(newPricing);
    setFailure(null);
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
        roomName={roomName}
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

      {/* Failure states */}
      {failure && <FailureNotice failure={failure} onAcceptPrice={handleAcceptNewPrice} onBack={onBack} onRetry={() => setFailure(null)} />}

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
          disabled={!agreed || processing || !!checkoutData}
          className="flex-1 rounded-xl bg-gold py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            `Pay ${formatCurrency(pricing.total)}`
          )}
        </button>
      </div>

      {/* Real Razorpay Checkout */}
      {checkoutData && (
        <RazorpayCheckout
          orderId={checkoutData.orderId}
          razorpayKey={checkoutData.razorpayKey}
          amountInPaise={checkoutData.amountInPaise}
          bookingId={checkoutData.bookingId}
          roomName={roomName}
          prefill={{
            name: guestDetails.fullName,
            email: guestDetails.email,
            contact: guestDetails.phone,
          }}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
        />
      )}
    </div>
  );
}

function FailureNotice({
  failure,
  onAcceptPrice,
  onBack,
  onRetry,
}: {
  failure: FailureState;
  onAcceptPrice: (p: BookingPricing) => void;
  onBack: () => void;
  onRetry: () => void;
}) {
  switch (failure.type) {
    case "no_longer_available":
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                These dates are no longer available.
              </p>
              <p className="mt-1 text-xs text-red-600">
                Another guest has booked this room. Please pick new dates or choose a different room.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onBack}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                >
                  Pick new dates
                </button>
                <a
                  href="tel:+919081354542"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Call reservations
                </a>
              </div>
            </div>
          </div>
        </div>
      );

    case "insufficient_inventory":
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Only {failure.remaining} room{failure.remaining > 1 ? "s" : ""} remaining for these dates.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Would you like to book {failure.remaining} room{failure.remaining > 1 ? "s" : ""} instead?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onBack}
                  className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                >
                  Adjust rooms
                </button>
                <button
                  onClick={onBack}
                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Choose different dates
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case "price_changed":
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Rates have been updated.
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Your new total is{" "}
                <span className="font-semibold">
                  {formatCurrency(failure.newPricing.total)}
                </span>
                . Would you like to continue?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onAcceptPrice(failure.newPricing)}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                >
                  Continue with new rate
                </button>
                <button
                  onClick={onBack}
                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case "payment_cancelled":
      return (
        <div className="rounded-xl border border-border-warm bg-cream p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 shrink-0 text-soft-gray" />
            <p className="text-sm text-soft-gray">
              Payment cancelled — click Pay when you&apos;re ready to try again.
            </p>
          </div>
        </div>
      );

    case "generic":
      return (
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-sm text-red-600">{failure.message}</p>
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      );
  }
}
