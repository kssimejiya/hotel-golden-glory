import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { PageHero } from "@/components/shared/PageHero";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { hotelInfo } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${hotelInfo.name} in ${hotelInfo.address.city}, ${hotelInfo.address.state} — phone, email, address, and map.`,
};

// Google Maps embed targets the verified Hotel Golden Glory place (ftid pins the
// exact business listing rather than relying on a fuzzy address query).
const mapsSrc =
  "https://www.google.com/maps?q=Hotel+Golden+Glory,+VV+Commercial+Complex,+Dhebar+Rd,+Millpara,+Bhakti+Nagar,+Rajkot,+Gujarat+360002&ftid=0x3959cbeefea1e7ad:0x220a1ca61eeb6d18&output=embed";

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact"
        subtitle="Reception at The Blues Hotel Golden Glory is open around the clock, every day. Call, write, or simply walk in — we'll take it from there."
      />
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="bg-white py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Left: Contact details */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-charcoal">
                  Get in touch
                </h2>
                <div className="mt-2 h-0.5 w-12 bg-gold" />
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <MapPin className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Address</p>
                  <address className="mt-1 not-italic text-sm leading-relaxed text-soft-gray">
                    {hotelInfo.address.street}
                    <br />
                    {hotelInfo.address.area}
                    <br />
                    {hotelInfo.address.city}, {hotelInfo.address.state}{" "}
                    {hotelInfo.address.zip}
                    <br />
                    {hotelInfo.address.country}
                  </address>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <Phone className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Phone</p>
                  <a
                    href={`tel:${hotelInfo.phone}`}
                    className="mt-1 block text-sm text-soft-gray transition-colors hover:text-gold"
                  >
                    {hotelInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <Mail className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Email</p>
                  <a
                    href={`mailto:${hotelInfo.email}`}
                    className="mt-1 block break-all text-sm text-soft-gray transition-colors hover:text-gold"
                  >
                    {hotelInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <Clock className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal">
                    Reception &amp; check-in
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm text-soft-gray">
                    <li>Check-in: {hotelInfo.checkIn}</li>
                    <li>Check-out: {hotelInfo.checkOut}</li>
                    <li>Reception hours: 24/7</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: Map */}
            <div>
              <div className="overflow-hidden rounded-2xl border border-border-warm shadow-sm">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <iframe
                    src={mapsSrc}
                    title={`Map showing ${hotelInfo.name}`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-soft-gray">
                In Bhakti Nagar, near Bhutkhana Petrol Pump — minutes from
                Rajkot Junction, the city&apos;s commercial centre, and the
                road west to Saurashtra. On-site parking, easy auto and cab
                access.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* LocalBusiness/Hotel structured data — optional but improves discoverability */}
      <script
        type="application/ld+json"
        // Server-rendered so it ships in the initial HTML; no client JS needed.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: hotelInfo.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: `${hotelInfo.address.street}, ${hotelInfo.address.area}`,
              addressLocality: hotelInfo.address.city,
              addressRegion: hotelInfo.address.state,
              postalCode: hotelInfo.address.zip,
              addressCountry: "IN",
            },
            telephone: hotelInfo.phone,
            email: hotelInfo.email,
            checkinTime: hotelInfo.checkIn,
            checkoutTime: hotelInfo.checkOut,
          }),
        }}
      />
    </>
  );
}
