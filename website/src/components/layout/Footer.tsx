import Link from "next/link";
import { hotelInfo, navLinks } from "@/lib/content";
import { Container } from "@/components/shared/Container";

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-body text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold">
                THE BLUES
              </span>
              <br />
              <span className="font-display text-xl font-bold text-blue">
                HOTEL GOLDEN GLORY
              </span>
            </div>
            <address className="not-italic text-sm leading-relaxed text-cream/70">
              {hotelInfo.address.full}
            </address>
            <ul className="mt-4 space-y-1 text-sm text-cream/70">
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

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold text-gold">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <a
                  href={`tel:${hotelInfo.phone}`}
                  className="transition-colors hover:text-gold"
                >
                  {hotelInfo.phone}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${hotelInfo.phone2}`}
                  className="transition-colors hover:text-gold"
                >
                  {hotelInfo.phone2}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="break-all transition-colors hover:text-gold"
                >
                  {hotelInfo.email}
                </a>
              </li>
            </ul>
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
