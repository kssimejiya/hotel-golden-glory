import Link from "next/link";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { hotelInfo, hotelLocation, navLinks } from "@/lib/content";
import { Container } from "@/components/shared/Container";

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_1.2fr]">
          {/* Brand, address and phones */}
          <div>
            <div className="mb-5">
              <span className="font-body text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
                THE BLUES
              </span>
              <br />
              <span className="font-display text-xl font-bold text-blue">
                HOTEL GOLDEN GLORY RAJKOT
              </span>
            </div>
            <address className="space-y-3 not-italic text-sm leading-relaxed text-cream/70">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                {hotelInfo.address.full}
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>
                  <a
                    href={`tel:${hotelInfo.phone}`}
                    className="transition-colors hover:text-gold"
                  >
                    {hotelInfo.phone}
                  </a>
                  <br />
                  <a
                    href={`tel:${hotelInfo.phone2}`}
                    className="transition-colors hover:text-gold"
                  >
                    {hotelInfo.phone2}
                  </a>
                </span>
              </p>
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="break-all transition-colors hover:text-gold"
                >
                  {hotelInfo.email}
                </a>
              </p>
            </address>
            <ul className="mt-5 space-y-1 text-sm text-cream/70">
              <li>Check-in: {hotelInfo.checkIn}</li>
              <li>Check-out: {hotelInfo.checkOut}</li>
              <li>Reception: 24/7</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold text-gold">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/booking"
                  className="text-sm text-cream/70 transition-colors hover:text-gold"
                >
                  Book Your Stay
                </Link>
              </li>
            </ul>
          </div>

          {/* Location — live map pin plus directions, as the final structure asks */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="mb-4 font-display text-lg font-semibold text-gold">
              Location
            </h3>
            <div className="overflow-hidden rounded-xl border border-cream/10">
              <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
                <iframe
                  src={hotelLocation.embedUrl}
                  title={`Map showing ${hotelInfo.name}`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
            <a
              href={hotelLocation.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-90"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Get Directions
            </a>
          </div>
        </div>
      </Container>

      {/* Bottom */}
      <div className="border-t border-cream/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-cream/50">
            &copy; {new Date().getFullYear()} {hotelInfo.name}. All rights
            reserved.
          </p>
          <div className="flex gap-6 text-xs text-cream/50">
            <Link
              href="/policies/cancellation"
              className="transition-colors hover:text-gold"
            >
              Cancellation Policy
            </Link>
            <Link
              href="/policies/privacy"
              className="transition-colors hover:text-gold"
            >
              Privacy Policy
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
