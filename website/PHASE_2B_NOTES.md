# Phase 2B — Custom Booking Flow

## What's Built

### 5-Step Booking Wizard (`/booking`)
A single-page multi-step wizard with animated transitions (AnimatePresence slide + fade):

1. **Dates & Guests** — Calendar-based date pickers (shadcn Calendar + Popover), +/- steppers for adults (1-4), children (0-3), rooms (1-3)
2. **Room & Plan** — All 4 room cards with live availability badges ("Available" / "Only N left" / "Sold out"), meal plan tabs (EP/CP/MAP), auto-derived occupancy
3. **Guest Details** — Full name, email, phone (+91 locked prefix), GSTIN (optional, regex validated), arrival time dropdown, special requests textarea. Zod validation with inline errors.
4. **Review & Pay** — Full booking summary card, price breakdown (base × nights × rooms + GST), cancellation policy, terms checkbox, mock Razorpay payment dialog
5. **Confirmation** (`/booking/[bookingId]/confirmation`) — Animated checkmark, booking ID, full summary, "Add to Calendar" (.ics download), contact actions

### Service Layer (Mock)
All services implement typed interfaces defined in `src/lib/services/types.ts`. Current implementations are mocks; swap is one file edit in `src/lib/services/index.ts`.

| Service | Mock File | Latency | Behavior |
|---------|-----------|---------|----------|
| AvailabilityService | `mocks/mockAvailability.ts` | 300ms | In-memory inventory map (deluxe:13, superior:13, premium:2, suite:6). Decrements on hold. |
| PaymentService | `mocks/mockPayment.ts` | 800ms | `createOrder` returns fake order_id. `verifyPayment` succeeds 90%, fails 10% randomly. |
| BookingRepository | `mocks/mockBookingRepo.ts` | 100-200ms | Module-level `Map<bookingId, Booking>`. ID format: `BHG-YYYYMMDD-XXXX`. |
| NotificationService | `mocks/mockNotifications.ts` | 0ms | `console.log` with realistic payloads. Always returns `{sent: true}`. |

### Booking Utilities
- **`pricing.ts`** — `calculatePricing()` with proper GST (12% below ₹7,500/night, 18% at/above). `formatCurrency()` uses `Intl.NumberFormat('en-IN')`. `formatDate()` uses `Intl.DateTimeFormat`.
- **`validators.ts`** — Zod schemas for guest details (name length, email format, phone regex, GSTIN regex) and dates (checkOut > checkIn).
- **`bookingId.ts`** — `BHG-YYYYMMDD-XXXX` format with no-ambiguity charset.
- **`ics.ts`** — Full ICS calendar event generation and browser download.
- **`store.ts`** — Zustand store with sessionStorage persistence. Auto-clears after 30 minutes idle.

### Data Model Extensions (`src/types/index.ts`)
Added: `BookingStatus`, `BookingDates`, `BookingGuests`, `BookingPricing`, `GuestDetails`, `NewBooking`, `Booking`.

---

## Files Created (36 files)

```
src/types/index.ts                                      (extended)
src/lib/services/types.ts
src/lib/services/index.ts
src/lib/services/README.md
src/lib/services/mocks/mockAvailability.ts
src/lib/services/mocks/mockPayment.ts
src/lib/services/mocks/mockBookingRepo.ts
src/lib/services/mocks/mockNotifications.ts
src/lib/booking/pricing.ts
src/lib/booking/validators.ts
src/lib/booking/bookingId.ts
src/lib/booking/ics.ts
src/lib/booking/store.ts
src/lib/hooks/useHydrated.ts
src/components/booking/BookingWizard.tsx
src/components/booking/WizardStepper.tsx
src/components/booking/StepDates.tsx
src/components/booking/StepRoomAndPlan.tsx
src/components/booking/StepGuestDetails.tsx
src/components/booking/StepReviewAndPay.tsx
src/components/booking/BookingSummaryCard.tsx
src/components/booking/PriceBreakdown.tsx
src/components/booking/GuestStepper.tsx
src/components/booking/DateRangePicker.tsx
src/components/booking/MockRazorpayDialog.tsx
src/components/booking/AvailabilityBadge.tsx
src/app/booking/page.tsx                                (replaced)
src/app/booking/[bookingId]/confirmation/page.tsx
src/app/booking/[bookingId]/confirmation/confirmation-content.tsx
src/app/booking/[bookingId]/failed/page.tsx
src/app/booking/[bookingId]/failed/failed-content.tsx
```

## Files Modified (3 files)

```
src/components/layout/Header.tsx                        (Book Now → /booking)
src/components/layout/MobileNav.tsx                     (Book Now → /booking)
package.json                                            (build script → --webpack)
```

## Files Deleted (1 file)

```
src/app/booking/booking-placeholder.tsx                 (replaced by wizard)
```

---

## Exact Swap Points for Real Services (Phase 2C)

| Service | Edit This File | Change |
|---------|---------------|--------|
| Availability | `src/lib/services/index.ts` line 7 | Import `firestoreAvailability` instead of `mockAvailability` |
| Payment | `src/lib/services/index.ts` line 8 | Import `razorpayPayment` instead of `mockPayment` |
| Booking Repo | `src/lib/services/index.ts` line 9 | Import `firestoreBookingRepo` instead of `mockBookingRepo` |
| Notifications | `src/lib/services/index.ts` line 10 | Import real `resendEmail` + `msg91SMS` + `slackAlert` instead of `mockNotifications` |
| Razorpay Modal | `src/components/booking/StepReviewAndPay.tsx` | Replace `MockRazorpayDialog` with real Razorpay script loader |

See `src/lib/services/README.md` for detailed per-service swap instructions.

---

## Still Placeholder

| Item | Location | Action |
|------|----------|--------|
| Cancellation policy | `StepReviewAndPay.tsx`, `mockBookingRepo.ts` | Replace with real hotel policy |
| Download PDF | Confirmation page | Button exists but disabled ("Coming soon") |
| Razorpay checkout | `MockRazorpayDialog.tsx` | Replace with real `checkout.razorpay.com/v1/checkout.js` |
| Email/SMS templates | `mockNotifications.ts` | Currently console.log; needs real Resend/MSG91 templates |
| Payment failure retry | Failed page | Currently re-routes to `/booking?room=&plan=` — doesn't restore full state |

---

## Manual Test Cases

1. **Happy path** — Select dates → select available room → fill valid guest details → pay (simulate success) → see confirmation with booking ID → download .ics
2. **Sold-out room** — Premium has only 2 rooms; book 3 rooms → Premium shows "Sold out"
3. **Payment failure** — Simulate failure in mock dialog → see failed page → retry
4. **Invalid GSTIN** — Enter malformed GSTIN → see inline error "Please enter a valid GSTIN"
5. **Invalid phone** — Enter phone without +91 prefix or wrong length → see inline error
6. **Empty required fields** — Try to continue from guest step without name/email/phone → all three show errors
7. **Date validation** — Set check-out before check-in → check-out resets; max 30-night range enforced
8. **Meal plan change** — Switch between EP/CP/MAP → preview total updates live
9. **Session persistence** — Fill step 1, refresh page → dates preserved from sessionStorage
10. **Session expiry** — Wait 30+ minutes (or manually set lastActivityAt in sessionStorage) → store resets on next visit
11. **Query param pre-fill** — Visit `/booking?room=blues-suite&plan=MAP` → room and plan pre-selected
12. **GST calculation** — Blues Suite MAP double is ₹6,999 (<₹7,500) → 12% GST; verify total = ₹6,999 × nights × 1.12

---

## Build Configuration Note

The `build` script uses `--webpack` flag due to a Turbopack font resolution bug in Next.js 16.2.4 that affects `next/font/google` during production builds. This can be removed when the Turbopack issue is resolved upstream.
