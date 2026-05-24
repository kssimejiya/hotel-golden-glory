import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { roomRepo } from "@/lib/firebase/roomRepo";
import { BookingConfirmationEmail } from "@/emails/BookingConfirmation";
import { mockNotifications } from "./mocks/mockNotifications";
import type { NotificationService } from "./types";
import type { Booking } from "@/types";

/**
 * Guest confirmation email via Resend.
 *
 * Graceful degradation: if RESEND_API_KEY is missing, the booking flow still
 * succeeds end-to-end. We render the email to HTML and:
 *   1. Print a tagged summary block to the server console.
 *   2. (Dev only) Write the rendered HTML to .email-previews/<bookingId>.html
 *      so the developer can open it in a browser and see the real layout.
 *
 * Only sendGuestEmail is real this phase. sendGuestSMS and sendHotelAlert
 * still delegate to the mock — see services/index.ts for the wiring.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "Hotel Golden Glory <onboarding@resend.dev>";

const PREVIEW_DIR = ".email-previews";

let cachedResend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!cachedResend) cachedResend = new Resend(RESEND_API_KEY);
  return cachedResend;
}

function buildSubject(booking: Booking): string {
  return `Booking Confirmed — ${booking.bookingId} — Hotel Golden Glory`;
}

async function lookupRoomName(booking: Booking): Promise<string | undefined> {
  try {
    const room = await roomRepo.getBySlug(booking.roomSlug);
    return room?.name;
  } catch (err) {
    console.warn(
      `[resendNotifications] room lookup failed for ${booking.roomSlug} (using slug as fallback):`,
      err
    );
    return undefined;
  }
}

async function writePreviewFile(
  booking: Booking,
  html: string
): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const dir = resolve(process.cwd(), PREVIEW_DIR);
    await mkdir(dir, { recursive: true });
    const path = resolve(dir, `${booking.bookingId}.html`);
    await writeFile(path, html, "utf8");
    return path;
  } catch (err) {
    console.warn("[resendNotifications] could not write preview file:", err);
    return null;
  }
}

function previewSummary(booking: Booking, subject: string): string {
  const lines = [
    `TO: ${booking.guest.email}`,
    `FROM: ${EMAIL_FROM}`,
    `SUBJECT: ${subject}`,
    "",
    `Booking ID: ${booking.bookingId}`,
    `Guest: ${booking.guest.fullName}`,
    `Room: ${booking.roomSlug} (${booking.mealPlan}, ${booking.occupancy})`,
    `Dates: ${booking.dates.checkIn} → ${booking.dates.checkOut} (${booking.dates.nights} night${booking.dates.nights > 1 ? "s" : ""})`,
    `Guests: ${booking.guests.adults} adult${booking.guests.adults > 1 ? "s" : ""}${
      booking.guests.children
        ? `, ${booking.guests.children} child${booking.guests.children > 1 ? "ren" : ""}`
        : ""
    } in ${booking.guests.rooms} room${booking.guests.rooms > 1 ? "s" : ""}`,
    `Total: ₹${booking.pricing.total.toLocaleString("en-IN")}`,
  ];
  return lines.join("\n  ");
}

export const resendNotifications: NotificationService = {
  async sendGuestEmail(booking: Booking) {
    const subject = buildSubject(booking);
    let html: string;
    try {
      const roomName = await lookupRoomName(booking);
      html = await render(
        BookingConfirmationEmail({ booking, roomName })
      );
    } catch (err) {
      console.error(
        `[resendNotifications] render failed for ${booking.bookingId}:`,
        err
      );
      return { sent: false };
    }

    const resend = getResend();
    if (!resend) {
      const previewPath = await writePreviewFile(booking, html);
      console.log(
        [
          "",
          "═══ EMAIL PREVIEW (Resend not configured) ═══",
          "  " + previewSummary(booking, subject),
          "",
          previewPath
            ? `  HTML preview: ${previewPath}`
            : "  HTML preview file disabled (production NODE_ENV).",
          "",
          "  To send real emails: set RESEND_API_KEY and EMAIL_FROM in .env.local",
          "═══════════════════════════════════════════════",
          "",
        ].join("\n")
      );
      // Treat preview-mode as a successful "send" so the booking flow's
      // optimistic UX matches the real path. The console block + HTML file
      // are the developer's confirmation that the email would have gone out.
      return { sent: true };
    }

    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: booking.guest.email,
        subject,
        html,
      });
      if (result.error) {
        console.error(
          `[resendNotifications] send failed for ${booking.bookingId}:`,
          result.error
        );
        return { sent: false };
      }
      console.log(
        `[resendNotifications] sent ${booking.bookingId} → ${booking.guest.email} (id: ${result.data?.id ?? "unknown"})`
      );
      return { sent: true };
    } catch (err) {
      // NEVER throw — a failed email must not break the booking flow.
      console.error(
        `[resendNotifications] unexpected send error for ${booking.bookingId}:`,
        err
      );
      return { sent: false };
    }
  },

  // still mocked — guest email is the only real channel this phase
  sendGuestSMS: mockNotifications.sendGuestSMS,
  // still mocked — guest email is the only real channel this phase
  sendHotelAlert: mockNotifications.sendHotelAlert,
};
