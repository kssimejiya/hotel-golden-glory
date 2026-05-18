"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { hotelInfo } from "@/lib/content";
import { useBookingWizardStore } from "@/lib/booking/store";
import type { Booking } from "@/types";

interface ConfirmationContentProps {
  booking: Booking;
  roomName?: string;
}

export function ConfirmationContent({ booking, roomName }: ConfirmationContentProps) {
  // Reset the booking wizard store now that the user has safely landed on
  // the confirmation page. This used to happen in StepReviewAndPay right
  // before router.push, which caused the still-mounted wizard to flash its
  // "Missing booking data" empty state for a frame before navigation. By
  // moving the reset here, the wizard component has already unmounted and
  // there's nothing left to flash. Using getState() instead of subscribing
  // avoids re-rendering this component when the store changes — the reset
  // is a fire-and-forget side effect, not a render dependency.
  useEffect(() => {
    useBookingWizardStore.getState().reset();
  }, []);

  return (
    <>
      <div className="h-20" />
      <section className="bg-cream py-12">
        <Container>
          <div className="mx-auto max-w-2xl">
            {/* Success icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center"
            >
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4 text-center"
            >
              <h1 className="font-display text-2xl font-bold text-charcoal">
                Booking Confirmed
              </h1>
              <p className="mt-2 text-lg font-semibold text-gold">
                {booking.bookingId}
              </p>
              <p className="mt-1 text-sm text-soft-gray">
                A confirmation has been sent to {booking.guest.email}
              </p>
            </motion.div>

            {/* Summary */}
            <div className="mt-8">
              <BookingSummaryCard
                roomSlug={booking.roomSlug}
                roomName={roomName}
                mealPlan={booking.mealPlan}
                occupancy={booking.occupancy}
                dates={booking.dates}
                guests={booking.guests}
                pricing={booking.pricing}
              />
            </div>

            {/* What's next — email-only (SMS notifications are disabled,
                see notifyBookingConfirmedAction). Keeps the practically
                useful items (ID, check-in, check-out) but drops anything
                we can't actually deliver yet. */}
            <div className="mt-6 rounded-2xl border border-border-warm bg-white p-5 shadow-sm">
              <h3 className="font-display text-base font-semibold text-charcoal">
                What&apos;s Next
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-soft-gray">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  Confirmation mail has been sent to your email
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  The hotel has been notified of your booking
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  Please carry a valid photo ID at check-in (14:00)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  Check-out is by 12:00 noon
                </li>
              </ul>
            </div>

            {/* Modification notice */}
            <div className="mt-6 rounded-xl bg-cream p-4 text-center">
              <p className="text-xs text-soft-gray">
                Need to modify or cancel? Contact our reservations team at{" "}
                <a
                  href={`tel:${hotelInfo.phone}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.phone}
                </a>{" "}
                or{" "}
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.email}
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
