import { Cake } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { BookingButton } from "@/components/shared/BookingButton";
import { specialOffer } from "@/lib/content";

/**
 * The closing band on the homepage — the running promotion plus its CTA.
 *
 * Charcoal, so it hands straight off to the charcoal footer below.
 */
export function SpecialOfferBanner() {
  return (
    <section className="relative overflow-hidden bg-charcoal py-16 sm:py-20">
      {/* Warm glow behind the content so the flat charcoal doesn't read as a
          dead zone between the white facilities section and the footer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 120% at 50% 0%, rgba(216,147,57,0.22) 0%, transparent 70%)",
        }}
      />

      <Container className="relative">
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-15">
              <Cake className="h-6 w-6 text-gold-light" aria-hidden="true" />
            </div>
            <p className="mt-6 font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {specialOffer.eyebrow}
            </p>
            <h2 className="mt-3 text-section-heading font-display font-semibold text-white">
              {specialOffer.title}
            </h2>
            <div className="mt-6 h-0.5 w-16 bg-gold" />
            <BookingButton
              variant="gold"
              size="lg"
              href={specialOffer.cta.href}
              className="mt-8"
            >
              {specialOffer.cta.label}
            </BookingButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
