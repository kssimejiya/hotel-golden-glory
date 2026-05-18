import type { Metadata } from "next";
import { bookingRepo } from "@/lib/services";
import { FailedContent } from "./failed-content";

export const metadata: Metadata = {
  title: "Payment Failed",
  description: "Your payment could not be processed. Please try again.",
};

export default async function FailedPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  // Best-effort booking lookup so the retry button can pre-fill room+plan.
  const booking = await bookingRepo.getById(bookingId);
  return <FailedContent bookingId={bookingId} booking={booking} />;
}
