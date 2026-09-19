"use client";

import { BedDouble, Building2, ConciergeBell, Croissant } from "lucide-react";
import { cn } from "@/lib/utils";
import { facilityGroups } from "@/lib/content";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const iconMap: Record<string, React.ElementType> = {
  Building2,
  ConciergeBell,
  BedDouble,
  Croissant,
};

/**
 * The four-dot (::) menu in the header corner: every amenity the hotel
 * offers, grouped as in the content brief.
 *
 * A right-hand sheet at every screen size. Base UI's Dialog portals it to
 * <body>, which matters here: the header's `will-change: transform` would
 * otherwise trap a fixed panel inside its 80px strip (MobileNav explains the
 * same problem). The dialog also brings focus trapping and Escape to close.
 */
export function AmenitiesMenu({ scrolled }: { scrolled: boolean }) {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Hotel amenities"
        className={cn(
          "relative z-50 rounded-lg p-2 transition-colors duration-300 hover:text-gold",
          scrolled ? "text-charcoal" : "text-white"
        )}
      >
        <FourDotsIcon className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto bg-white p-0 data-[side=right]:w-[88%] data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border-warm px-6 pb-5 pt-6">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Hotel Golden Glory Rajkot
          </p>
          <SheetTitle className="mt-1 font-display text-2xl font-semibold text-charcoal">
            Amenities
          </SheetTitle>
          <SheetDescription className="text-soft-gray">
            What the hotel provides — around the property, in your room and at
            breakfast.
          </SheetDescription>
        </SheetHeader>

        <div className="divide-y divide-border-warm px-6">
          {facilityGroups.map((group) => {
            const Icon = iconMap[group.icon];
            return (
              <section key={group.id} className="py-5">
                <h3 className="flex items-center gap-2.5 font-display text-base font-semibold text-charcoal">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-10">
                    {Icon && (
                      <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                    )}
                  </span>
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-relaxed text-soft-gray"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Four dots in a square — the "::" the final structure describes. */
function FourDotsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="8" r="2.25" />
      <circle cx="16" cy="8" r="2.25" />
      <circle cx="8" cy="16" r="2.25" />
      <circle cx="16" cy="16" r="2.25" />
    </svg>
  );
}
