import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rooms as staticRooms } from "@/lib/content";
import { roomRepo } from "@/lib/firebase/roomRepo";
import type { RoomSlug } from "@/types";
import { RoomDetail } from "./room-detail";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

// ISR backstop — see notes on /rooms/page.tsx. Room content + rates change
// rarely; admin edits trigger revalidatePath. 1h is a safe upper bound.
export const revalidate = 3600;

export async function generateStaticParams() {
  return staticRooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = await roomRepo.getBySlug(slug as RoomSlug);
  if (!room) return {};

  return {
    title: room.name,
    description: `${room.name} at Hotel Golden Glory, Rajkot — ${room.sqft} sqft, ${room.tagline}. Starting from ₹${room.rates[0].single.toLocaleString("en-IN")} per night.`,
    openGraph: {
      title: `${room.name} — Hotel Golden Glory`,
      description: `${room.tagline}. ${room.sqft} sqft, from ₹${room.rates[0].single.toLocaleString("en-IN")}/night.`,
      images: [{ url: room.heroImage, width: 1200, height: 800 }],
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const allRooms = await roomRepo.list();
  const room = allRooms.find((r) => r.slug === (slug as RoomSlug));

  if (!room) {
    notFound();
  }

  const otherRooms = allRooms.filter((r) => r.slug !== room.slug);

  return <RoomDetail room={room} otherRooms={otherRooms} />;
}
