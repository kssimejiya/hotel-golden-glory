"use server";

import { revalidatePath } from "next/cache";
import { bookingRepo } from "@/lib/services";
import { verifyAdminSession } from "./session";
import type { BookingStatus } from "@/types";

const validStatuses: BookingStatus[] = [
  "draft",
  "awaiting_payment",
  "confirmed",
  "cancelled",
  "failed",
];

export async function updateBookingStatusAction(
  bookingId: string,
  status: string
) {
  const user = await verifyAdminSession();
  if (!user) return { error: "Unauthorized" };

  if (!validStatuses.includes(status as BookingStatus)) {
    return { error: "Invalid status" };
  }

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return { error: "Booking not found" };
  }

  try {
    await bookingRepo.updateStatus(bookingId, status as BookingStatus);
  } catch (err) {
    console.error("[updateBookingStatusAction] failed:", err);
    return { error: "Failed to update booking status" };
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { success: true };
}
