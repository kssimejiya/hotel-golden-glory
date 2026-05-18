"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, X } from "lucide-react";
import { formatCurrency } from "@/lib/booking/pricing";

interface MockRazorpayDialogProps {
  amount: number;
  bookingId: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onFailure: () => void;
  onClose: () => void;
}

export function MockRazorpayDialog({
  amount,
  bookingId,
  onSuccess,
  onFailure,
  onClose,
}: MockRazorpayDialogProps) {
  const [processing, setProcessing] = useState(false);

  // Close on Escape — matches platform-native modal expectations.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [processing, onClose]);

  const handleSuccess = () => {
    setProcessing(true);
    setTimeout(() => {
      const paymentId = `pay_mock_${Date.now()}`;
      const signature = `sig_mock_${Date.now()}`;
      onSuccess(paymentId, signature);
    }, 1200);
  };

  const handleFailure = () => {
    setProcessing(true);
    setTimeout(() => {
      onFailure();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/65 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Payment dialog"
      >
        {/* Dev-mode header band: makes the mock framing look intentional */}
        <div className="flex items-center justify-between border-b border-border-warm bg-cream/60 px-5 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Dev Preview · Razorpay Mock
          </span>
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-full p-1 text-soft-gray transition-colors hover:bg-white hover:text-charcoal disabled:opacity-40"
            aria-label="Close payment dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/10">
            <CreditCard className="h-7 w-7 text-blue" />
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
            Amount to pay
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-charcoal">
            {formatCurrency(amount)}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-soft-gray">
            <ShieldCheck className="h-3 w-3" />
            Booking <span className="font-medium text-charcoal">{bookingId}</span>
          </p>
        </div>

        <div className="mx-6 mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-center text-xs leading-relaxed text-amber-700">
            <strong className="font-semibold">Development mock.</strong> In
            production, the real Razorpay Checkout will replace this dialog
            with the live card / UPI / netbanking flow.
          </p>
        </div>

        <div className="px-6 pb-6">
          {processing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <span className="text-sm text-soft-gray">
                Processing payment…
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSuccess}
                className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-green-700 hover:shadow"
              >
                Simulate Success
              </button>
              <button
                onClick={handleFailure}
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:-translate-y-px hover:bg-red-50"
              >
                Simulate Failure
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
