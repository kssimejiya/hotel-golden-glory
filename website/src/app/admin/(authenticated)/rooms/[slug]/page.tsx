import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { roomRepo } from "@/lib/firebase/roomRepo";
import { availabilityRepo } from "@/lib/firebase/availabilityRepo";
import type { RoomSlug } from "@/types";
import { TotalRoomsEditor } from "./total-rooms-editor";
import { GalleryEditor } from "./gallery-editor";
import { AvailabilityEditor } from "./availability-editor";
import { RateEditor } from "./rate-editor";

const VALID_SLUGS: RoomSlug[] = ["deluxe", "superior", "premium", "blues-suite"];

function isValidSlug(s: string): s is RoomSlug {
  return (VALID_SLUGS as string[]).includes(s);
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0]!;
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

export default async function AdminRoomEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const room = await roomRepo.getBySlug(slug);
  if (!room) notFound();

  const [blocksWindow, occupancy] = await Promise.all([
    availabilityRepo.getBlocksForRange(slug, todayIso(), plusDaysIso(90)),
    availabilityRepo.getOccupancyForRange(
      slug,
      room.totalRooms,
      todayIso(),
      plusDaysIso(30)
    ),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/rooms"
          className="inline-flex items-center gap-1 text-xs font-medium text-soft-gray hover:text-charcoal"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to rooms
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-charcoal">
          {room.name}
        </h1>
        <p className="text-sm text-soft-gray">{room.tagline}</p>
      </div>

      <section className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">Inventory</h2>
        <p className="mt-1 text-xs text-soft-gray">
          The number of physical rooms in this category. Drives availability checks
          on the booking page.
        </p>
        <div className="mt-3">
          <TotalRoomsEditor slug={slug} initialValue={room.totalRooms} />
        </div>
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">Rates</h2>
        <p className="mt-1 text-xs text-soft-gray">
          Per-night rates for each meal plan × occupancy. Changes apply
          immediately to the website and booking flow.
        </p>
        <div className="mt-4">
          <RateEditor slug={slug} rates={room.rates} />
        </div>
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-charcoal">Photos</h2>
          <p className="text-xs text-soft-gray">
            {room.gallery.length} {room.gallery.length === 1 ? "image" : "images"}
          </p>
        </div>
        <p className="mt-1 text-xs text-soft-gray">
          Upload, delete, reorder, and pick the hero image (shown first on /rooms
          and detail pages).
        </p>
        <div className="mt-4">
          <GalleryEditor
            slug={slug}
            heroImage={room.heroImage}
            gallery={room.gallery}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal">Availability</h2>
        <p className="mt-1 text-xs text-soft-gray">
          Block rooms across a date range (renovations, holds, owner stays). These
          subtract from inventory before availability is calculated.
        </p>
        <div className="mt-4">
          <AvailabilityEditor
            slug={slug}
            totalRooms={room.totalRooms}
            existingBlocks={blocksWindow}
            occupancy={occupancy}
          />
        </div>
      </section>
    </div>
  );
}
