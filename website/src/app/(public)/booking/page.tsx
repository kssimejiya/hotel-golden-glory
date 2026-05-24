import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Container } from "@/components/shared/Container";
import { roomRepo } from "@/lib/firebase/roomRepo";

export const metadata: Metadata = {
  title: "Book Your Stay",
  description:
    "Book your room at Hotel Golden Glory, Rajkot. Choose from Deluxe, Superior, Premium, or Blues Suite with flexible meal plans.",
};

export default async function BookingPage() {
  const rooms = await roomRepo.list();
  return (
    <Suspense
      fallback={
        <section className="bg-cream py-24">
          <Container>
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          </Container>
        </section>
      }
    >
      <BookingWizard rooms={rooms} />
    </Suspense>
  );
}
