import { notFound } from "next/navigation";
import { bookingRepo } from "@/lib/services";
import { getRoomBySlug, mealPlanLabels } from "@/lib/content";
import { BookingStatusUpdate } from "./booking-status-update";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const booking = await bookingRepo.getById(bookingId);

  if (!booking) {
    notFound();
  }

  const room = getRoomBySlug(booking.roomSlug);
  const mealPlan = mealPlanLabels[booking.mealPlan];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-soft-gray hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal">
            {booking.bookingId}
          </h1>
          <p className="mt-1 text-sm text-soft-gray">
            Created {new Date(booking.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <BookingStatusUpdate
          bookingId={booking.bookingId}
          currentStatus={booking.status}
        />
      </div>

      {/* Guest details */}
      <div className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">Guest Details</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Full Name</dt>
            <dd className="font-medium text-charcoal">
              {booking.guest.fullName}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Phone</dt>
            <dd className="font-medium text-charcoal">
              {booking.guest.phone}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Email</dt>
            <dd className="font-medium text-charcoal">
              {booking.guest.email}
            </dd>
          </div>
          {booking.guest.gstin && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">GSTIN</dt>
              <dd className="font-medium text-charcoal">
                {booking.guest.gstin}
              </dd>
            </div>
          )}
          {booking.guest.arrivalTime && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Expected Arrival</dt>
              <dd className="font-medium text-charcoal">
                {booking.guest.arrivalTime}
              </dd>
            </div>
          )}
          {booking.guest.specialRequests && (
            <div className="col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Special Requests</dt>
              <dd className="font-medium text-charcoal">
                {booking.guest.specialRequests}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Booking details */}
      <div className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">
          Booking Details
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Room</dt>
            <dd className="font-medium text-charcoal">
              {room?.name ?? booking.roomSlug}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Meal Plan</dt>
            <dd className="font-medium text-charcoal">
              {mealPlan?.full ?? booking.mealPlan}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Occupancy</dt>
            <dd className="font-medium capitalize text-charcoal">
              {booking.occupancy}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Rooms</dt>
            <dd className="font-medium text-charcoal">
              {booking.guests.rooms}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Check-in</dt>
            <dd className="font-medium text-charcoal">
              {booking.dates.checkIn}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Check-out</dt>
            <dd className="font-medium text-charcoal">
              {booking.dates.checkOut}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Nights</dt>
            <dd className="font-medium text-charcoal">
              {booking.dates.nights}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Guests</dt>
            <dd className="font-medium text-charcoal">
              {booking.guests.adults} adult{booking.guests.adults !== 1 && "s"}
              {booking.guests.children > 0 &&
                `, ${booking.guests.children} child${booking.guests.children !== 1 ? "ren" : ""}`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">Pricing</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-soft-gray">
              Base rate &times; {booking.pricing.nights} night
              {booking.pricing.nights !== 1 && "s"} &times;{" "}
              {booking.pricing.rooms} room{booking.pricing.rooms !== 1 && "s"}
            </dt>
            <dd className="shrink-0 font-medium tabular-nums text-charcoal">
              ₹{booking.pricing.subtotal.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-soft-gray">GST</dt>
            <dd className="font-medium tabular-nums text-charcoal">
              ₹{booking.pricing.taxes.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border-warm pt-3">
            <dt className="font-semibold text-charcoal">Total</dt>
            <dd className="font-body text-lg font-bold tabular-nums text-green-700">
              ₹{booking.pricing.total.toLocaleString("en-IN")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Payment info */}
      {(booking.paymentId || booking.paymentOrderId) && (
        <div className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-charcoal">
            Payment Info
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {booking.paymentOrderId && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Order ID</dt>
                <dd className="font-mono text-xs text-charcoal">
                  {booking.paymentOrderId}
                </dd>
              </div>
            )}
            {booking.paymentId && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-soft-gray">Payment ID</dt>
                <dd className="font-mono text-xs text-charcoal">
                  {booking.paymentId}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
