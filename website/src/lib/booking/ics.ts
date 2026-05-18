import type { Booking } from "@/types";
import { hotelInfo } from "@/lib/content";

export function generateICS(booking: Booking): string {
  const checkIn = booking.dates.checkIn.replace(/-/g, "");
  const checkOut = booking.dates.checkOut.replace(/-/g, "");
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Blues Hotel Golden Glory//Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${checkIn}`,
    `DTEND;VALUE=DATE:${checkOut}`,
    `DTSTAMP:${now}`,
    `UID:${booking.bookingId}@hotelgoldenglory.com`,
    `SUMMARY:Stay at ${hotelInfo.name}`,
    `DESCRIPTION:Booking ID: ${booking.bookingId}\\nRoom: ${booking.roomSlug}\\nGuests: ${booking.guests.adults} adults\\nCheck-in: 14:00\\nCheck-out: 12:00 noon\\nPhone: ${hotelInfo.phone}`,
    `LOCATION:${hotelInfo.address.full}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(booking: Booking): void {
  const ics = generateICS(booking);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-${booking.bookingId}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
