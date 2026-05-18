import { bookingRepo } from "@/lib/services";
import { BookingsTable } from "./bookings-table";

export default async function AdminBookingsPage() {
  const bookings = await bookingRepo.list();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-soft-gray">
          {bookings.length} total — change status, review guest details, and
          filter by state.
        </p>
      </div>
      <BookingsTable bookings={bookings} />
    </div>
  );
}
