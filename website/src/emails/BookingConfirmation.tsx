import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { hotelInfo, mealPlanLabels } from "@/lib/content";
import type { Booking } from "@/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

// Email-safe brand tokens (inline-styled below; CSS classes don't survive
// across all clients — Outlook in particular drops most external styles).
const COLORS = {
  gold: "#D89339",
  goldLight: "#E8B563",
  blue: "#2563D9",
  cream: "#FAF6F0",
  charcoal: "#1F1F1F",
  softGray: "#6B6B6B",
  borderWarm: "#E8E2D8",
  white: "#FFFFFF",
} as const;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(n: number): string {
  return inr.format(n);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(d: string): string {
  return dateFmt.format(new Date(d));
}

function firstName(fullName: string): string {
  return (fullName.trim().split(/\s+/)[0] ?? "there").slice(0, 40);
}

// Inline style helpers — keeping the stylesheet flat & cloneable so Outlook
// doesn't strip anything important.
const main: React.CSSProperties = {
  backgroundColor: COLORS.cream,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
  color: COLORS.charcoal,
};

const outer: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "24px 16px",
};

const card: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.borderWarm}`,
  borderRadius: "12px",
  padding: "24px",
  marginTop: "16px",
};

const headerBar: React.CSSProperties = {
  borderTop: `4px solid ${COLORS.gold}`,
  backgroundColor: COLORS.charcoal,
  color: COLORS.cream,
  padding: "24px",
  borderRadius: "12px 12px 0 0",
  textAlign: "center" as const,
};

const brandSmall: React.CSSProperties = {
  color: COLORS.goldLight,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const brandBig: React.CSSProperties = {
  color: COLORS.white,
  fontSize: "22px",
  margin: "0 0 4px",
  fontWeight: 700,
};

const headingH1: React.CSSProperties = {
  color: COLORS.white,
  fontSize: "26px",
  fontWeight: 700,
  margin: "16px 0 4px",
};

const bookingIdPill: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: COLORS.gold,
  color: COLORS.white,
  borderRadius: "999px",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  marginTop: "10px",
};

const sectionTitle: React.CSSProperties = {
  color: COLORS.charcoal,
  fontSize: "16px",
  fontWeight: 700,
  margin: "0 0 12px",
};

const labelText: React.CSSProperties = {
  color: COLORS.softGray,
  fontSize: "13px",
  margin: 0,
};

const valueText: React.CSSProperties = {
  color: COLORS.charcoal,
  fontSize: "14px",
  fontWeight: 600,
  margin: 0,
};

const row: React.CSSProperties = {
  borderBottom: `1px solid ${COLORS.borderWarm}`,
  padding: "10px 0",
};

const totalRow: React.CSSProperties = {
  padding: "12px 0 0",
  borderTop: `2px solid ${COLORS.charcoal}`,
  marginTop: "8px",
};

const goldRule: React.CSSProperties = {
  height: "2px",
  width: "40px",
  backgroundColor: COLORS.gold,
  border: 0,
  margin: "0 0 12px",
};

const footerText: React.CSSProperties = {
  color: COLORS.softGray,
  fontSize: "12px",
  lineHeight: "1.6",
  textAlign: "center" as const,
};

const linkStyle: React.CSSProperties = {
  color: COLORS.blue,
  textDecoration: "underline",
};

interface BookingConfirmationEmailProps {
  booking: Booking;
  /** Optional friendly room name; falls back to the slug if not provided. */
  roomName?: string;
}

export function BookingConfirmationEmail({
  booking,
  roomName,
}: BookingConfirmationEmailProps) {
  const planLabel = mealPlanLabels[booking.mealPlan]?.full ?? booking.mealPlan;
  const guestFirst = firstName(booking.guest.fullName);
  const roomDisplay = roomName ?? booking.roomSlug;
  const guestsLine = booking.guests.children
    ? `${booking.guests.adults} adult${booking.guests.adults > 1 ? "s" : ""}, ${booking.guests.children} child${booking.guests.children > 1 ? "ren" : ""}`
    : `${booking.guests.adults} adult${booking.guests.adults > 1 ? "s" : ""}`;
  const roomsLine =
    booking.guests.rooms > 1 ? `${booking.guests.rooms} rooms` : "1 room";
  const previewText = `Your booking ${booking.bookingId} at ${hotelInfo.name} is confirmed.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Header */}
          <Section style={headerBar}>
            <Text style={brandSmall}>The Blues</Text>
            <Text style={brandBig}>{hotelInfo.shortName}</Text>
            <Heading as="h1" style={headingH1}>
              Booking Confirmed
            </Heading>
            <Text style={{ ...bookingIdPill }}>{booking.bookingId}</Text>
          </Section>

          {/* Greeting */}
          <Section style={card}>
            <Text style={{ fontSize: "16px", margin: "0 0 12px" }}>
              Hi {guestFirst},
            </Text>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: COLORS.softGray,
                margin: 0,
              }}
            >
              Thank you for booking with {hotelInfo.name}. Your reservation is
              confirmed and we&apos;re looking forward to welcoming you. Here
              are your booking details — please keep this email handy.
            </Text>
          </Section>

          {/* Stay summary */}
          <Section style={card}>
            <Text style={sectionTitle}>Your stay</Text>
            <Hr style={goldRule} />

            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              width="100%"
              style={{ borderCollapse: "collapse" as const }}
            >
              <tbody>
                <tr style={row}>
                  <td style={{ width: "45%" }}>
                    <Text style={labelText}>Room</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>{roomDisplay}</Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>Plan</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>{planLabel}</Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>Check-in</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>
                      {formatDate(booking.dates.checkIn)}
                      <br />
                      <span
                        style={{
                          color: COLORS.softGray,
                          fontWeight: 400,
                          fontSize: "12px",
                        }}
                      >
                        from {hotelInfo.checkIn}
                      </span>
                    </Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>Check-out</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>
                      {formatDate(booking.dates.checkOut)}
                      <br />
                      <span
                        style={{
                          color: COLORS.softGray,
                          fontWeight: 400,
                          fontSize: "12px",
                        }}
                      >
                        by {hotelInfo.checkOut}
                      </span>
                    </Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>Duration</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>
                      {booking.dates.nights} night
                      {booking.dates.nights > 1 ? "s" : ""}
                    </Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>Guests</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>{guestsLine}</Text>
                  </td>
                </tr>
                <tr style={{ ...row, borderBottom: "none" }}>
                  <td>
                    <Text style={labelText}>Rooms</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>{roomsLine}</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Pricing */}
          <Section style={card}>
            <Text style={sectionTitle}>Amount paid</Text>
            <Hr style={goldRule} />

            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              width="100%"
              style={{ borderCollapse: "collapse" as const }}
            >
              <tbody>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>
                      Base rate × {booking.pricing.nights} night
                      {booking.pricing.nights > 1 ? "s" : ""}
                      {booking.pricing.rooms > 1
                        ? ` × ${booking.pricing.rooms} rooms`
                        : ""}
                    </Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>
                      {formatINR(booking.pricing.subtotal)}
                    </Text>
                  </td>
                </tr>
                <tr style={row}>
                  <td>
                    <Text style={labelText}>GST</Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text style={valueText}>
                      {formatINR(booking.pricing.taxes)}
                    </Text>
                  </td>
                </tr>
                <tr style={totalRow}>
                  <td>
                    <Text
                      style={{
                        ...valueText,
                        fontSize: "16px",
                      }}
                    >
                      Total
                    </Text>
                  </td>
                  <td style={{ textAlign: "right" as const }}>
                    <Text
                      style={{
                        ...valueText,
                        fontSize: "20px",
                        color: COLORS.gold,
                      }}
                    >
                      {formatINR(booking.pricing.total)}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* What's next */}
          <Section style={card}>
            <Text style={sectionTitle}>What&apos;s next</Text>
            <Hr style={goldRule} />
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                color: COLORS.softGray,
                fontSize: "14px",
                lineHeight: "1.7",
              }}
            >
              <li>
                Please carry a valid photo ID at check-in (
                {hotelInfo.checkIn}).
              </li>
              <li>Check-out is by {hotelInfo.checkOut}.</li>
              <li>
                Show this email or quote your booking ID at the front desk.
              </li>
              <li>
                Need to make changes? See our{" "}
                <Link
                  href={`${SITE_URL}/policies/cancellation`}
                  style={linkStyle}
                >
                  cancellation policy
                </Link>{" "}
                or contact reservations.
              </li>
            </ul>
          </Section>

          {/* Hotel contact */}
          <Section style={card}>
            <Text style={sectionTitle}>Getting in touch</Text>
            <Hr style={goldRule} />
            <Text
              style={{
                margin: "0 0 12px",
                fontSize: "14px",
                lineHeight: "1.6",
                color: COLORS.charcoal,
              }}
            >
              {hotelInfo.address.full}
            </Text>
            <Text style={{ margin: "0 0 6px", fontSize: "14px" }}>
              Phone:{" "}
              <Link href={`tel:${hotelInfo.phone}`} style={linkStyle}>
                {hotelInfo.phone}
              </Link>{" "}
              /{" "}
              <Link href={`tel:${hotelInfo.phone2}`} style={linkStyle}>
                {hotelInfo.phone2}
              </Link>
            </Text>
            <Text style={{ margin: 0, fontSize: "14px" }}>
              Reservations:{" "}
              <Link
                href={`mailto:${hotelInfo.email}`}
                style={linkStyle}
              >
                {hotelInfo.email}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ padding: "24px 8px 8px" }}>
            <Text style={footerText}>
              This is an automated confirmation for booking{" "}
              <strong>{booking.bookingId}</strong>. Please do not reply to this
              email — for any queries, contact us at the email or phone above.
            </Text>
            <Text style={{ ...footerText, marginTop: "8px" }}>
              © {new Date().getFullYear()} {hotelInfo.name},{" "}
              {hotelInfo.address.city}, {hotelInfo.address.state}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default BookingConfirmationEmail;
