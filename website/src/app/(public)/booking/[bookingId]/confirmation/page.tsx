import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { bookingRepo } from "@/lib/services";
import { roomRepo } from "@/lib/firebase/roomRepo";
import { ConfirmationContent } from "./confirmation-content";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your booking at Hotel Golden Glory has been confirmed.",
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await bookingRepo.getById(bookingId);

  if (!booking) {
    return (
      <>
        <div className="h-20" />
        <section className="bg-cream py-32">
          <Container>
            <div className="mx-auto max-w-md text-center">
              <h1 className="font-display text-2xl font-bold text-charcoal">
                Booking Not Found
              </h1>
              <p className="mt-2 text-sm text-soft-gray">
                We couldn&apos;t find booking <strong>{bookingId}</strong>. It
                may have expired. Please contact reservations.
              </p>
            </div>
          </Container>
        </section>
      </>
    );
  }

  const room = await roomRepo.getBySlug(booking.roomSlug);
  return <ConfirmationContent booking={booking} roomName={room?.name} />;
}
