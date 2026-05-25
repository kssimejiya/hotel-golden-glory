"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpaySuccessResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutProps {
  orderId: string;
  razorpayKey: string;
  amountInPaise: number;
  bookingId: string;
  roomName: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (response: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => void;
  onDismiss: () => void;
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SCRIPT_URL}"]`
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Razorpay script failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({
  orderId,
  razorpayKey,
  amountInPaise,
  bookingId,
  roomName,
  prefill,
  onSuccess,
  onDismiss,
}: RazorpayCheckoutProps) {
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);
  const paymentSucceededRef = useRef(false);

  const openCheckout = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: "The Blues Hotel Golden Glory",
      description: `Booking ${bookingId} — ${roomName}`,
      order_id: orderId,
      prefill,
      notes: { bookingId },
      theme: { color: "#D89339" },
      modal: {
        ondismiss: () => {
          // Razorpay fires ondismiss even after successful payment when the
          // modal auto-closes. Only treat as abandonment if handler never fired.
          if (!paymentSucceededRef.current) {
            onDismiss();
          }
        },
      },
      handler: (response: RazorpaySuccessResponse) => {
        paymentSucceededRef.current = true;
        onSuccess({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => {
      onDismiss();
    });
    rzp.open();
  }, [
    orderId,
    razorpayKey,
    amountInPaise,
    bookingId,
    roomName,
    prefill,
    onSuccess,
    onDismiss,
  ]);

  useEffect(() => {
    loadScript()
      .then(openCheckout)
      .catch(() => {
        setError(
          "Our payment system is temporarily unavailable. Please try again or contact reservations."
        );
      });
  }, [openCheckout]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/65 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <p className="text-sm text-red-600">{error}</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setError(null);
                openedRef.current = false;
                loadScript().then(openCheckout).catch(() =>
                  setError("Still unavailable. Please contact reservations.")
                );
              }}
              className="flex-1 rounded-xl bg-gold py-3 text-sm font-semibold text-white"
            >
              Retry
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-border-warm py-3 text-sm font-semibold text-charcoal"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
