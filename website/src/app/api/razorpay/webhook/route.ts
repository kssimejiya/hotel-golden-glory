import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { bookingRepo, notifications } from "@/lib/services";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const WEBHOOK_EVENTS_COLLECTION = "webhook_events";
const BOOKINGS_COLLECTION = "bookings";

export async function POST(request: Request) {
  // Must read raw body for HMAC verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // If webhook secret is not configured, refuse to process
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.warn(
      "[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook. Configure it in Razorpay Dashboard."
    );
    return NextResponse.json(
      { error: "Webhook verification not configured" },
      { status: 503 }
    );
  }

  if (!signature) {
    console.warn("[razorpay/webhook] Missing x-razorpay-signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  // Verify HMAC SHA256
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    console.warn("[razorpay/webhook] Signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Parse event
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = event.event_id ?? `${event.event}_${Date.now()}`;

  // Idempotency: check if we've already processed this event
  const db = adminDb();
  const eventRef = db.collection(WEBHOOK_EVENTS_COLLECTION).doc(eventId);
  const existingEvent = await eventRef.get();
  if (existingEvent.exists) {
    return NextResponse.json({ status: "already_processed" });
  }

  // Process based on event type
  const eventType = event.event;

  switch (eventType) {
    case "payment.captured":
    case "order.paid":
      await handlePaymentCaptured(event, eventId, eventRef);
      break;

    case "payment.failed":
      await handlePaymentFailed(event, eventId, eventRef);
      break;

    case "refund.processed":
      console.log(
        `[razorpay/webhook] refund.processed — logged only (future scope). Event: ${eventId}`
      );
      await eventRef.set({ eventId, event: eventType, processedAt: new Date().toISOString() });
      break;

    default:
      console.log(`[razorpay/webhook] Unhandled event type: ${eventType}`);
      await eventRef.set({ eventId, event: eventType, processedAt: new Date().toISOString(), status: "ignored" });
  }

  return NextResponse.json({ status: "ok" });
}

async function handlePaymentCaptured(
  event: WebhookEvent,
  eventId: string,
  eventRef: FirebaseFirestore.DocumentReference
) {
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "no_payment_entity" });
    return;
  }

  const bookingId =
    payment.notes?.bookingId ?? await findBookingByOrderId(payment.order_id);

  if (!bookingId) {
    console.error(
      `[razorpay/webhook] payment.captured: could not find bookingId for order ${payment.order_id}`
    );
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "booking_not_found" });
    return;
  }

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "booking_not_found" });
    return;
  }

  // Idempotent: if already confirmed, no-op
  if (booking.status === "confirmed") {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "already_confirmed" });
    return;
  }

  if (booking.status === "cancelled") {
    console.warn(
      `[razorpay/webhook] payment.captured for cancelled booking ${bookingId} — logging inconsistency`
    );
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "cancelled_inconsistency" });
    return;
  }

  // Confirm the booking
  await adminDb()
    .collection(BOOKINGS_COLLECTION)
    .doc(bookingId)
    .update({
      status: "confirmed",
      paymentId: payment.id,
      paymentOrderId: payment.order_id,
    });

  // Notifications — best effort
  try {
    const confirmedBooking = await bookingRepo.getById(bookingId);
    if (confirmedBooking) {
      await notifications.sendGuestEmail(confirmedBooking);
      await notifications.sendHotelAlert(confirmedBooking);
    }
  } catch (notifyErr) {
    console.error(
      `[razorpay/webhook] notification failed for ${bookingId}:`,
      notifyErr
    );
  }

  await eventRef.set({
    eventId,
    event: event.event,
    processedAt: new Date().toISOString(),
    status: "confirmed",
    bookingId,
  });
}

async function handlePaymentFailed(
  event: WebhookEvent,
  eventId: string,
  eventRef: FirebaseFirestore.DocumentReference
) {
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "no_payment_entity" });
    return;
  }

  const bookingId =
    payment.notes?.bookingId ?? await findBookingByOrderId(payment.order_id);

  if (!bookingId) {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "booking_not_found" });
    return;
  }

  const booking = await bookingRepo.getById(bookingId);
  if (!booking || booking.status !== "awaiting_payment") {
    await eventRef.set({ eventId, event: event.event, processedAt: new Date().toISOString(), status: "no_action_needed" });
    return;
  }

  await bookingRepo.updateStatus(bookingId, "failed");
  await eventRef.set({
    eventId,
    event: event.event,
    processedAt: new Date().toISOString(),
    status: "failed",
    bookingId,
  });
}

async function findBookingByOrderId(
  orderId: string | undefined
): Promise<string | null> {
  if (!orderId) return null;
  try {
    const snap = await adminDb()
      .collection(BOOKINGS_COLLECTION)
      .where("paymentOrderId", "==", orderId)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0]!.id;
  } catch {
    // fall through
  }
  return null;
}

interface WebhookEvent {
  event_id?: string;
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        notes?: Record<string, string>;
      };
    };
  };
}
