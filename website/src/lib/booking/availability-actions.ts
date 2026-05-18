"use server";

import { firestoreAvailability } from "@/lib/firebase/availabilityRepo";
import type { RoomSlug } from "@/types";

export async function checkAvailabilityAction(input: {
  roomSlug: RoomSlug;
  checkIn: string;
  checkOut: string;
  rooms: number;
}) {
  return firestoreAvailability.check(input);
}
