import type { Metadata } from "next";
import { RoomsListing } from "./rooms-listing";
import { roomRepo } from "@/lib/firebase/roomRepo";

// ISR backstop — admin actions call revalidatePath('/rooms') on every edit,
// so the cache is correct in normal operation. The 1h backstop ensures the
// page eventually refreshes even if a future code path mutates rooms
// without invoking revalidatePath. Room content + rates change rarely.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description:
    "Explore 34 thoughtfully designed rooms across 4 categories at Hotel Golden Glory, Rajkot. Deluxe, Superior, Premium with balcony, and Blues Suite — from ₹2,799 per night.",
  openGraph: {
    title: "Rooms & Suites — Hotel Golden Glory",
    description:
      "34 rooms, 4 categories, starting from ₹2,799. Find your perfect room in Rajkot.",
  },
};

export default async function RoomsPage() {
  const rooms = await roomRepo.list();
  return <RoomsListing rooms={rooms} />;
}
