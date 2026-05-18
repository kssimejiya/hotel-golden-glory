import type { Metadata } from "next";
import { Container } from "@/components/shared/Container";
import { PageHero } from "@/components/shared/PageHero";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { hotelInfo } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Blues Hotel Golden Glory collects, uses, and protects guest data.",
};

// PRIVACY COPY — review with legal before launch

const LAST_UPDATED = "May 2026";

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-border-warm pt-8">
      <h2 className="font-display text-lg font-semibold text-charcoal">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-soft-gray">
        {children}
      </div>
    </section>
  );
}

function PolicyList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-gold">{children}</ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle="What we collect, why we collect it, and your rights."
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <article className="mx-auto max-w-2xl text-charcoal">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
              Last updated · {LAST_UPDATED}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-soft-gray">
              This policy describes how {hotelInfo.name} (&ldquo;the
              hotel&rdquo;, &ldquo;we&rdquo;) handles personal information you
              provide when booking, staying, or contacting us. By using our
              website or services you consent to the practices described
              below.
            </p>

            <PolicySection title="Information we collect">
              <PolicyList>
                <li>
                  <strong>Booking details:</strong> name, email, phone, arrival
                  time, special requests, number of guests, and dates of stay.
                </li>
                <li>
                  <strong>Identity proof:</strong> photo ID is captured at
                  check-in as required by Indian hospitality regulations and
                  retained per applicable law.
                </li>
                <li>
                  <strong>Payment information:</strong> processed by our
                  payment partner (Razorpay). We do <strong>not</strong> store
                  full card numbers or CVV on our servers; we only retain the
                  order ID and payment status.
                </li>
                <li>
                  <strong>GSTIN:</strong> optional, captured when a guest
                  requests a tax invoice for business travel.
                </li>
                <li>
                  <strong>Site analytics:</strong> standard server logs (IP,
                  browser, pages viewed) used to operate and improve the site.
                </li>
              </PolicyList>
            </PolicySection>

            <PolicySection title="How we use this information">
              <PolicyList>
                <li>To fulfil your booking and prepare your stay.</li>
                <li>
                  To send confirmations, reminders, and status updates by
                  email and SMS.
                </li>
                <li>
                  To meet legal, tax, and law-enforcement requirements (e.g.
                  guest registers, GST invoicing).
                </li>
                <li>
                  To respond to enquiries you send via phone, email, or
                  reservations.
                </li>
              </PolicyList>
            </PolicySection>

            <PolicySection title="Sharing">
              <PolicyList>
                <li>
                  <strong>Payment processor:</strong> Razorpay receives the
                  data required to take payment.
                </li>
                <li>
                  <strong>Service providers:</strong> email and SMS partners
                  receive only the fields needed to deliver your confirmation.
                </li>
                <li>
                  <strong>Regulatory:</strong> when required by law, we may
                  share information with government authorities.
                </li>
                <li>
                  <strong>We do not sell guest data</strong> to advertisers,
                  data brokers, or third parties.
                </li>
              </PolicyList>
            </PolicySection>

            <PolicySection title="Data retention">
              <p>
                Booking records are retained for the period required by Indian
                tax and hospitality regulations (typically up to 8 years for
                GST-related records). After that, records are deleted or
                anonymised.
              </p>
            </PolicySection>

            <PolicySection title="Cookies">
              <p>
                Our website uses functional cookies required to keep your
                booking session active across the multi-step booking flow. We
                do not currently use third-party advertising or tracking
                cookies.
              </p>
            </PolicySection>

            <PolicySection title="Your rights">
              <p>
                You may request access to, correction of, or deletion of your
                personal data held by us, subject to records we are legally
                obliged to keep. Email{" "}
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.email}
                </a>{" "}
                with the subject &ldquo;Privacy request&rdquo; and we will
                respond within a reasonable time.
              </p>
            </PolicySection>

            <PolicySection title="Contact">
              <p>
                Privacy queries:{" "}
                <a
                  href={`mailto:${hotelInfo.email}`}
                  className="font-medium text-blue hover:text-blue-dark"
                >
                  {hotelInfo.email}
                </a>
                <br />
                Address: {hotelInfo.address.full}
              </p>
            </PolicySection>
          </article>
        </Container>
      </section>
    </>
  );
}
