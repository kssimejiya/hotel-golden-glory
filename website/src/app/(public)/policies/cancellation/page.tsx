import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { PageHero } from "@/components/shared/PageHero";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { hotelInfo } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "Cancellation and refund terms for bookings at The Blues Hotel Golden Glory, Rajkot.",
};

// POLICY COPY — confirm exact terms with hotel management before launch

const LAST_UPDATED = "May 2026";

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-border-warm pt-8 first-of-type:mt-10">
      <h2 className="font-display text-lg font-semibold text-charcoal">
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-soft-gray marker:text-gold">
        {children}
      </ul>
    </section>
  );
}

export default function CancellationPolicyPage() {
  return (
    <>
      <PageHero
        title="Cancellation Policy"
        subtitle="Clear, fair terms for changes and cancellations."
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Cancellation Policy" },
        ]}
      />

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <article className="mx-auto max-w-2xl text-charcoal">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
              Last updated · {LAST_UPDATED}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-soft-gray">
              The following terms apply to all bookings made directly with{" "}
              {hotelInfo.name}. Bookings through third-party travel agents may
              be subject to that agent&apos;s policy.
            </p>

            <PolicySection title="Free cancellation window">
              <li>
                Cancellations made <strong>more than 24 hours</strong> before
                the check-in date (14:00 IST) are eligible for a full refund.
              </li>
            </PolicySection>

            <PolicySection title="Late cancellation">
              <li>
                Cancellations within 24 hours of the check-in date:{" "}
                <strong>one night&apos;s room charge is retained</strong> and
                the remainder is refunded.
              </li>
            </PolicySection>

            <PolicySection title="No-show">
              <li>
                If the guest does not arrive on the check-in date and has not
                informed the hotel, the{" "}
                <strong>first night&apos;s room charge is retained</strong>.
                The booking is then released.
              </li>
            </PolicySection>

            <PolicySection title="Early checkout">
              <li>
                Once checked in, the full booking amount stands.{" "}
                <strong>No refund is provided for unused nights.</strong>
              </li>
            </PolicySection>

            <PolicySection title="Refund timing">
              <li>
                Refunds are processed to the original payment method within{" "}
                <strong>7–10 business days</strong> of the cancellation
                request being approved. Bank processing times may add a few
                additional days.
              </li>
            </PolicySection>

            <PolicySection title="Modifications">
              <li>
                Date or room changes are subject to availability and any rate
                difference between the original and new dates/category.
              </li>
            </PolicySection>

            <PolicySection title="How to cancel or modify">
              <li>
                Phone:{" "}
                <a
                  href={`tel:${hotelInfo.phone}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.phone}
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.email}
                </a>
              </li>
            </PolicySection>
          </article>
        </Container>
      </section>
    </>
  );
}
