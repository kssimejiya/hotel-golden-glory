# Phase: Razorpay Payment Integration

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/razorpay/server.ts` | Singleton Razorpay client (server-only), initialized from `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` |
| `src/lib/services/razorpayPayment.ts` | Implements `PaymentService` interface with real Razorpay order creation + HMAC signature verification |
| `src/lib/booking/finalize-actions.ts` | Server action: pre-payment availability re-check, server-side pricing, booking creation, order creation |
| `src/lib/booking/verify-actions.ts` | Server action: signature verification, booking confirmation, notification dispatch |
| `src/components/booking/RazorpayCheckout.tsx` | Client component: loads Razorpay Checkout.js dynamically, opens payment modal |
| `src/app/api/razorpay/webhook/route.ts` | Webhook handler with HMAC verification, idempotency via `webhook_events` collection |

## Files Modified

| File | Change |
|------|--------|
| `src/lib/services/index.ts` | Swapped `mockPayment` → `razorpayPayment` |
| `src/components/booking/StepReviewAndPay.tsx` | Complete rewrite: uses `finalizeBookingForPayment` + `RazorpayCheckout` + failure UX states |
| `.env.local` | Renamed vars to `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, added `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET` |
| `.env.local.example` | Added Razorpay section with documentation |
| `package.json` | Added `razorpay` dependency |

## Files Renamed (not deleted)

| Original | New | Reason |
|----------|-----|--------|
| `src/components/booking/MockRazorpayDialog.tsx` | `src/components/booking/_MockRazorpayDialog.deprecated.tsx` | Reference only, not imported |

---

## Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_...        # Server: order creation
RAZORPAY_KEY_SECRET=...              # Server ONLY: signature verification
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...  # Client: Checkout.js key param
RAZORPAY_WEBHOOK_SECRET=             # Server: webhook HMAC (set after configuring in dashboard)
```

---

## Webhook Setup Instructions

1. Go to **Razorpay Dashboard → Settings → Webhooks → Add New Webhook**
2. URL: `https://<your-domain>/api/razorpay/webhook`
3. Active Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
4. Copy the generated **Webhook Secret** into `RAZORPAY_WEBHOOK_SECRET` env var
5. Deploy

**Local testing with ngrok:**
```bash
ngrok http 3000
# Copy the https URL → set as webhook URL in Razorpay test dashboard
# Set RAZORPAY_WEBHOOK_SECRET in .env.local
```

---

## Test Card Numbers

From [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/):

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | Success |
| 5267 3181 8797 5449 | Success (Mastercard) |
| 4000 0000 0000 0002 | Declined |

- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any
- **3D Secure**: Auto-approved in test mode

**UPI test:** Use `success@razorpay` for success, `failure@razorpay` for failure.

---

## Developer Manual Test Plan

### Happy Path

1. **Full booking flow**: Select room → dates → guest details → review → click Pay → Razorpay modal opens → use test card `4111 1111 1111 1111` → success → confirmation page displays → booking shows `confirmed` in admin panel
2. **Admin verification**: Open admin → bookings → latest booking → confirm `paymentId` and `paymentOrderId` fields are populated
3. **Email trigger**: Check server console (or Resend dashboard if configured) for confirmation email output

### Failure Paths

4. **Card decline**: Use test card `4000 0000 0000 0002` → payment fails → redirected to `/booking/[id]/failed` page with retry CTA
5. **User dismisses modal**: Open Razorpay modal → close it (X or Escape) → returns to Step 4 with "Payment cancelled" notice → booking marked `cancelled` in Firestore
6. **Availability race condition**:
   - Open **two browser windows**, both reach Step 4 for the same Premium room (totalRooms=2)
   - Pay in window 1 (success)
   - Click Pay in window 2 → should show "no longer available" or "Only N room(s) remaining" error — never both succeed
7. **Price race condition**:
   - User is on Step 4
   - In admin panel, edit the rate for that room's meal plan
   - User clicks Pay → should see "Rates have been updated. Your new total is ₹X" prompt with Continue/Cancel

### Idempotency / Webhook

8. **Webhook verification** (requires ngrok or staging):
   - Configure webhook in Razorpay test dashboard pointing to your URL
   - Complete a booking → verify webhook arrives → booking confirmed
   - Manually replay the webhook from Razorpay dashboard → verify no second email, no duplicate processing
   - Check `webhook_events` collection in Firestore for the deduplicated entry

---

## Architecture Decisions

### Script Loading Strategy
Razorpay Checkout.js is loaded via manual `<script>` injection (not `next/script`) because:
- We need the script loaded on-demand only when the user actually clicks Pay
- `next/script` with `strategy="lazyOnload"` loads after page hydration regardless of user intent
- Manual injection gives precise control + error handling

### Pre-payment Availability Hold
`awaiting_payment` status already counts as occupying inventory (per `availabilityRepo.ts` line 12: `OCCUPYING_STATUSES = ["confirmed", "awaiting_payment"]`). This means:
- When a user enters Razorpay checkout, their room is "held" for up to ~10 minutes
- If they abandon, the booking moves to `cancelled` and inventory frees up
- **Future work**: A scheduled job should expire `awaiting_payment` bookings older than 30 minutes

### Webhook as Source of Truth
The client-side verification (`verifyPaymentAndConfirm`) handles the happy path inline. The webhook handler (`/api/razorpay/webhook`) is the safety net for:
- Browser closes mid-payment
- Network drops after Razorpay processes but before client handler fires
- Any race condition between client and webhook — idempotency ensures at-most-once confirmation

---

## Going Live Checklist

- [ ] Replace `rzp_test_*` keys with live keys from Razorpay Dashboard → Settings → API Keys
- [ ] Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` on production
- [ ] Create webhook on live mode: `https://<production-domain>/api/razorpay/webhook`
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` from the live webhook configuration
- [ ] Remove test card testing — use real card with small amount (₹1) if needed for smoke test
- [ ] Verify Razorpay account KYC is complete (required for live mode)
- [ ] Confirm settlement account details in Razorpay Dashboard
- [ ] Deploy and verify first live transaction end-to-end

---

## Future Work (Out of Scope)

- **Expiry cron**: Cancel `awaiting_payment` bookings older than 30 minutes (prevents inventory lock from abandoned checkouts)
- **Refund flow**: Handle `refund.processed` webhook event to update booking status
- **Retry logic**: Allow guests to retry payment on a failed booking without creating a new one
- **SMS notifications**: Wire up a real SMS provider for booking confirmation
