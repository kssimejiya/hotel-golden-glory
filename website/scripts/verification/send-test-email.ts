/**
 * Send a test confirmation email without running a full booking flow.
 *
 * - If RESEND_API_KEY is set: sends a real email via Resend.
 * - If not set: renders the template and writes the HTML preview to disk.
 *
 * Usage:  npx tsx scripts/verification/send-test-email.ts [recipient@example.com]
 *
 * The recipient argument is optional — defaults to "verify@example.com".
 * The booking data is synthetic (not read from Firestore).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { render } from "@react-email/render";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const recipientArg = process.argv[2] || "verify@example.com";

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM =
    process.env.EMAIL_FROM || "Hotel Golden Glory <onboarding@resend.dev>";

  const mockBooking = {
    bookingId: "BHG-TEST-EMAIL",
    roomSlug: "deluxe" as const,
    mealPlan: "EP" as const,
    occupancy: "double" as const,
    dates: {
      checkIn: "2026-07-01",
      checkOut: "2026-07-03",
      nights: 2,
    },
    guests: {
      adults: 2,
      children: 1,
      rooms: 1,
    },
    pricing: {
      baseRate: 3499,
      nights: 2,
      rooms: 1,
      subtotal: 6998,
      taxes: 840,
      total: 7838,
    },
    guest: {
      fullName: "Verification Test Guest",
      email: recipientArg,
      phone: "+919876543210",
      specialRequests: "This is a test email from the verification suite.",
    },
    status: "confirmed" as const,
    createdAt: new Date().toISOString(),
    cancellationPolicy:
      "Free cancellation up to 24 hours before check-in. Cancellations within 24 hours of check-in or no-shows will be charged one night's room rate.",
  };

  // Dynamic import to load the email template (it uses JSX)
  const { BookingConfirmationEmail } = await import(
    "../../src/emails/BookingConfirmation"
  );

  console.log("\nRendering email template...");
  const html = await render(
    BookingConfirmationEmail({ booking: mockBooking, roomName: "Deluxe Room" })
  );
  console.log(`✓ Template rendered (${html.length} bytes)\n`);

  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — writing preview to disk instead.\n");
    const dir = resolve(process.cwd(), ".email-previews");
    await mkdir(dir, { recursive: true });
    const path = resolve(dir, "verification-test.html");
    await writeFile(path, html, "utf8");
    console.log(`✓ HTML preview written: ${path}`);
    console.log("  Open this file in a browser to inspect the email layout.");
    console.log("\n  To send a real email, set RESEND_API_KEY in .env.local and re-run.");
    return;
  }

  console.log(`Sending real email via Resend...`);
  console.log(`  FROM: ${EMAIL_FROM}`);
  console.log(`  TO:   ${recipientArg}`);
  console.log(`  SUBJECT: Booking Confirmed — ${mockBooking.bookingId} — Hotel Golden Glory\n`);

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: recipientArg,
    subject: `Booking Confirmed — ${mockBooking.bookingId} — Hotel Golden Glory`,
    html,
  });

  if (result.error) {
    console.error("✗ Send failed:", result.error);
    process.exit(1);
  }

  console.log(`✓ Email sent successfully!`);
  console.log(`  Resend ID: ${result.data?.id ?? "unknown"}`);
  console.log(`\n  Check the inbox for ${recipientArg} (also check spam/junk).`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
