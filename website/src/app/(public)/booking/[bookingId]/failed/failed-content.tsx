"use client";

import { useRouter } from "next/navigation";
import { XCircle, Phone, Mail } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { hotelInfo } from "@/lib/content";
import type { Booking } from "@/types";

interface FailedContentProps {
  bookingId: string;
  booking: Booking | null;
}

export function FailedContent({ bookingId, booking }: FailedContentProps) {
  const router = useRouter();

  function handleRetry() {
    if (!booking) {
      router.push("/booking");
      return;
    }
    const params = new URLSearchParams({
      room: booking.roomSlug,
      plan: booking.mealPlan,
    });
    router.push(`/booking?${params.toString()}`);
  }

  return (
    <>
      <div className="h-20" />
      <section className="bg-cream py-16">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />

            <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">
              Payment Failed
            </h1>
            <p className="mt-2 text-sm text-soft-gray">
              Your payment for booking{" "}
              <strong className="text-charcoal">{bookingId}</strong> could not
              be processed. No amount has been charged.
            </p>

            <button
              onClick={handleRetry}
              className="mt-8 w-full rounded-xl bg-gold px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gold-90 hover:shadow active:scale-[0.99]"
            >
              Try Again
            </button>

            <div className="mt-6 rounded-xl border border-border-warm bg-white p-4">
              <p className="text-xs text-soft-gray">
                Need help? Contact our reservations team:
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={`tel:${hotelInfo.phone}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-blue hover:text-blue-dark"
                >
                  <Phone className="h-4 w-4" />
                  {hotelInfo.phone}
                </a>
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-blue hover:text-blue-dark"
                >
                  <Mail className="h-4 w-4" />
                  {hotelInfo.email}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
