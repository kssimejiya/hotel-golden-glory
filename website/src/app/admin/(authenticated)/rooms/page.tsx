import Link from "next/link";
import { BedDouble, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { resolveHeroImage } from "@/lib/images/gallery";
import { roomRepo } from "@/lib/firebase/roomRepo";

export default async function AdminRoomsPage() {
  const rooms = await roomRepo.list();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal">Rooms</h1>
        <p className="mt-1 text-sm text-soft-gray">
          Manage room photos, inventory, rates, and date-based availability.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((room) => (
          <Link
            key={room.slug}
            href={`/admin/rooms/${room.slug}`}
            className="group flex overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
          >
            <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-cream">
              {room.heroImage && (
                <SmartImage
                  image={resolveHeroImage(room)}
                  alt={room.name}
                  fill
                  sizes="128px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center px-4 py-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-soft-gray">
                <BedDouble className="h-3 w-3" />
                {room.totalRooms} rooms · {room.gallery.length} photos
              </div>
              <h3 className="mt-1.5 font-display text-base font-semibold text-charcoal">
                {room.name}
              </h3>
              <p className="line-clamp-2 text-xs text-soft-gray">{room.tagline}</p>
            </div>
            <div className="flex items-center pr-4 text-soft-gray transition-all group-hover:translate-x-0.5 group-hover:text-gold">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
