# Phase 4 — Real guest confirmation email, Phase 3 verification + bug fixes, design polish

## Phase 3 Verification

Approach: this sandbox has no live Firebase project, so checks that touch
Firestore are **code traces** rather than runtime tests. Each trace links to
the exact file:line that backs the claim, and ends with the manual test the
developer must run with live credentials.

### Check 1 — `firestoreBookingRepo.create()` and `getById()` round-trip — **PASS (code trace)**

- `create()` builds the doc from `NewBooking + bookingId + status='awaiting_payment' + createdAt(Timestamp.now()) + cancellationPolicy` and writes with `.set(docData)`. [firestoreBookingRepo.ts:35-51](website/src/lib/services/firestoreBookingRepo.ts#L35-L51)
- `getById()` reads with `.get()`, returns null if `!exists`, else passes through `fromDoc()`. [firestoreBookingRepo.ts:53-62](website/src/lib/services/firestoreBookingRepo.ts#L53-L62)
- `fromDoc()` converts the `createdAt` Timestamp back to an ISO string and spreads every other field unchanged. [firestoreBookingRepo.ts:23-32](website/src/lib/services/firestoreBookingRepo.ts#L23-L32)
- No field is dropped or reshaped between write and read.

**Manual test:** in dev with live Firebase, complete a booking via `/booking` → simulate success → visit `/admin/bookings/{id}` → all guest, dates, pricing, status fields render. Kill `npm run dev`, restart, reload the page → still present.

### Check 2 — Premium 2 → 1 → 0 across confirmed bookings — **PASS (code trace)**

- Premium has `totalRooms: 2` (content.ts).
- 1st confirmed booking for `rooms=1`: `readBookingHeldMap` increments `held=1` on each overlapping night ([availabilityRepo.ts:110-114](website/src/lib/firebase/availabilityRepo.ts#L110-L114)). `check()` returns `remainingInventory = 2 − 0 − 1 = 1, available = (1 ≥ 1) true`.
- 2nd confirmed booking for `rooms=1` with overlap: `held=2`. `remainingInventory = 2 − 0 − 2 = 0, available = (0 ≥ 1) false`.
- The query at [availabilityRepo.ts:95-100](website/src/lib/firebase/availabilityRepo.ts#L95-L100) filters by `roomSlug==X AND status in ['confirmed','awaiting_payment'] AND dates.checkIn <= rangeEnd`; the `checkOut > rangeStart` half is refined in code at line 108.

**Manual test:** complete two overlapping Premium bookings, observe Step 2 of a third booking with the same dates show "Sold out" for Premium.

### Check 3 — Multi-night overlap math — **PASS (code trace)**

Take the brief's example: existing booking `checkIn=2024-05-20, checkOut=2024-05-22` (occupies nights 20, 21). Query `checkIn=2024-05-21, checkOut=2024-05-23` (asks about nights 21, 22).

Trace through `firestoreAvailability.check()`:
1. `getDatesInRange("2024-05-21","2024-05-23")` → `["2024-05-21","2024-05-22"]` (loop `while current < end`, [availabilityRepo.ts:25](website/src/lib/firebase/availabilityRepo.ts#L25)).
2. `readBookingHeldMap` query returns the existing booking (its `dates.checkIn = "2024-05-20" <= rangeEnd = "2024-05-22"`, and `checkOut = "2024-05-22" > rangeStart = "2024-05-21"` so it's kept by the in-code refinement on line 108).
3. Per-date refinement at [availabilityRepo.ts:110-114](website/src/lib/firebase/availabilityRepo.ts#L110-L114):
   - `date=2024-05-21`: `"2024-05-20" <= "2024-05-21" && "2024-05-21" < "2024-05-22"` → both true → `held[2024-05-21] += 1`
   - `date=2024-05-22`: `"2024-05-20" <= "2024-05-22" && "2024-05-22" < "2024-05-22"` → second is false → not held
4. `minAvailable = min(total − blocked − held)` across nights → `min(2 − 0 − 1, 2 − 0 − 0) = min(1, 2) = 1`. ✓ The brief's expected "reduced inventory on the overlapping night, full inventory elsewhere" matches exactly.
5. Result: `available = (1 ≥ 1) true, remainingInventory = 1`. The "Only 1 left" badge surfaces the MIN across nights, exactly as the brief required.

A range is unavailable when any single night lacks capacity (line 158, `if (avail < minAvailable) minAvailable = avail`) — the implementation is correct.

**Manual test:** create a booking for 2024-05-20 → 2024-05-22 (Premium, 1 room). Open `/booking` and pick 2024-05-21 → 2024-05-23 → Premium row should show "Only 1 left" (because totalRooms=2, night 21 has 1 held).

### Check 4 — `calculatePricing` reads merged Firestore rates — **PASS (code trace)**

Full call path:
1. [src/app/(public)/booking/page.tsx:14](website/src/app/(public)/booking/page.tsx#L14): server component calls `roomRepo.list()` which merges Firestore overrides on top of static defaults ([roomRepo.ts:73-76](website/src/lib/firebase/roomRepo.ts#L73-L76), `rates` is among the override-able fields per [roomRepo.ts:13](website/src/lib/firebase/roomRepo.ts#L13)).
2. Same file line 27: passes `rooms` prop to `<BookingWizard rooms={rooms} />`.
3. [BookingWizard.tsx:53,118,134](website/src/components/booking/BookingWizard.tsx#L53): threads `rooms` to `<StepRoomAndPlan rooms={rooms}>` and `<StepReviewAndPay rooms={rooms}>`.
4. [StepRoomAndPlan.tsx:105](website/src/components/booking/StepRoomAndPlan.tsx#L105): `selectedRoom = rooms.find(...)` — uses the merged Room.
5. [StepRoomAndPlan.tsx:109-117, 120-123](website/src/components/booking/StepRoomAndPlan.tsx#L109-L123): both `handleContinue()` and the live `previewPricing` call `calculatePricing(selectedRoom, ...)`.
6. [pricing.ts:1-21](website/src/lib/booking/pricing.ts#L1-L21): zero imports of `@/lib/content` or `getRoomBySlug`. Reads `room.rates.find(...)` from the passed Room.

✓ Rate edits in `/admin/rooms/<slug>` (which write to Firestore `rooms/{slug}.rates`) are merged in step 1 above and surface in the wizard's preview AND the persisted booking's `pricing`.

**Manual test:** Phase 3 NOTES test #11–12.

### Check 5 — `admin: true` claim gate — **PASS (code trace)**

Two enforcement points, both guarded:

- **Login path** ([session.ts:35-79](website/src/lib/admin/session.ts#L35-L79)): `createAdminSessionCookie()` calls `adminAuth().verifyIdToken(idToken, true)` (line 44; `checkRevoked=true` rejects disabled/revoked accounts). Line 49 rejects when `decoded.admin !== true` — no session cookie is minted, the POST `/api/admin/session` returns 401, and the client receives the friendly "not authorised for admin access" message ([login-form.tsx:81-92](website/src/app/admin/login/login-form.tsx#L81-L92)).
- **Every protected page / mutation** ([session.ts:87-105](website/src/lib/admin/session.ts#L87-L105)): `verifyAdminSession()` calls `adminAuth().verifySessionCookie(cookieValue, true)` and re-checks the `admin` claim. Called by the authenticated layout (page-render gate, [layout.tsx:14-17](website/src/app/admin/(authenticated)/layout.tsx#L14-L17)) and by every server action's `requireAdmin()` shim.

✓ A Firebase Auth user without the `admin: true` custom claim cannot reach `/admin/*` and cannot mutate via server actions.

**Caveat to document** (not a bug, behavior): a session cookie minted while the user had `admin: true` continues to verify until expiry, even after the claim is revoked. This is standard Firebase session-cookie behavior. The `set-admin-claim.ts --off` and `--revoke` flags revoke refresh tokens to take effect immediately; without those flags, removed claims take effect on next sign-in (or up to 8h later).

**Manual test:** Phase 3 NOTES test #5.

---

## Bugs found in Sub-Phase 0 (fixed in Sub-Phase 1)

1. **`preload` is not a valid Next.js Image prop** — should be `priority`. The unknown prop bubbles to the DOM and triggers a React "Unknown prop" warning in dev. Three call sites:
   - [Hero.tsx:74](website/src/components/sections/Hero.tsx#L74)
   - [rooms-listing.tsx:61](website/src/app/(public)/rooms/rooms-listing.tsx#L61)
   - [RoomGalleryHero.tsx:23](website/src/components/rooms/RoomGalleryHero.tsx#L23)

2. **Pre-existing exhaustive-deps lint warning** — [StepRoomAndPlan.tsx:90](website/src/components/booking/StepRoomAndPlan.tsx#L90). The `useEffect` calls `rooms.map(...)` inside but `rooms` is not in the deps. If the parent ever passes a new `rooms` array (e.g. after a future revalidate), availability checks won't re-fire.

3. **Two `eslint-disable-next-line react-hooks/exhaustive-deps`** — [BookingWizard.tsx:34, 47](website/src/components/booking/BookingWizard.tsx#L34). The suppressions hide the fact that `store` isn't in the deps. The intent (run once on mount / once per searchParams change) is correct, but the right way is to read store via `useBookingWizardStore.getState()` inside the effect, not to suppress.

4. **One `@ts-expect-error`** — [StepGuestDetails.tsx:80](website/src/components/booking/StepGuestDetails.tsx#L80). The inline style sets a CSS custom property `--tw-shake` that no class or rule consumes — the shake actually comes from the `animate-[shake_0.2s_ease-in-out]` className. Dead style block.

5. **Firestore composite-index requirement for `readBookingHeldMap`** — the query at [availabilityRepo.ts:95-100](website/src/lib/firebase/availabilityRepo.ts#L95-L100) combines an equality (`roomSlug`), an `in` (`status`), and a range (`dates.checkIn`). Firestore will reject this with `FAILED_PRECONDITION: query requires an index` on first run. The current catch block silently returns empty held — **silent oversell risk** in production. Need a `firestore.indexes.json` and corresponding deploy step.

6. **Razorpay orderId placeholder** — [StepReviewAndPay.tsx:91](website/src/components/booking/StepReviewAndPay.tsx#L91) passes `order_${currentBookingId}` to `verifyPaymentAction` instead of the real orderId returned by `createPaymentOrderAction`. Currently harmless (mock ignores it) but will break the moment Razorpay is real. Already documented in Phase 3 NOTES as a "remaining gap" — re-confirmed here; Phase 4 keeps it documented for the Razorpay phase since fixing requires the real payment-flow shape.

7. **Mock log noise** — [mockBookingRepo.ts](website/src/lib/services/mocks/mockBookingRepo.ts), [mockPayment.ts](website/src/lib/services/mocks/mockPayment.ts), [mockNotifications.ts](website/src/lib/services/mocks/mockNotifications.ts) — `console.log` statements predate the real Firestore swap and create noise in dev. `mockBookingRepo` is unused; the other mocks still run. Reduce to a single tagged line each for visibility.

---

## Bug fixes (Sub-Phase 1)

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | [Hero.tsx:70-80](website/src/components/sections/Hero.tsx#L70), [rooms-listing.tsx:54-61](website/src/app/(public)/rooms/rooms-listing.tsx#L54), [RoomGalleryHero.tsx:19-27](website/src/components/rooms/RoomGalleryHero.tsx#L19) | `preload` is not a valid Next.js `<Image>` prop. The unknown prop bubbled to the DOM and produced React warnings. | Renamed to `priority` (the correct Next.js prop). Removed redundant `decoding="async"` (set automatically by Next). |
| 2 | [StepRoomAndPlan.tsx:90](website/src/components/booking/StepRoomAndPlan.tsx#L90) | exhaustive-deps lint warning: `rooms` missing from useEffect deps array. Future re-fetches of the rooms list wouldn't re-trigger availability checks. | Added `rooms` to the deps array. The current call site passes a stable reference, so no extra fetches in practice — but the contract is now correct. |
| 3 | [BookingWizard.tsx:34, 47](website/src/components/booking/BookingWizard.tsx) | Two `eslint-disable-next-line react-hooks/exhaustive-deps` suppressions hiding store-in-deps issues. | Replaced subscribed `useBookingWizardStore()` with imperative `useBookingWizardStore.getState()` inside the effect, so the deps array can be honest (URL params / `[]`). Lint suppression removed. |
| 4 | [StepGuestDetails.tsx:80](website/src/components/booking/StepGuestDetails.tsx#L80) | `@ts-expect-error` covering a `style={{ "--tw-shake": ... }}` inline custom property that nothing read. Worse, the `animate-[shake_...]` class was non-functional too because no `@keyframes shake` existed anywhere in the CSS. | Removed the dead inline style. Added a real `@keyframes shake` to [globals.css](website/src/app/globals.css) with `prefers-reduced-motion` override. The shake-on-invalid-submit feature now works. |
| 5 | [availabilityRepo.ts:95-100](website/src/lib/firebase/availabilityRepo.ts#L95-L100) — Firestore composite-index requirement | `where("roomSlug", "==")` + `where("status", "in", [...])` + `where("dates.checkIn", "<=")` requires a composite index. Without it, Firestore throws `FAILED_PRECONDITION: query requires an index` and the existing catch block silently returns empty held → silent oversell. | Added [firestore.indexes.json](firestore.indexes.json) declaring the composite index, plus [firebase.json](firebase.json) so `firebase deploy --only firestore` ships rules + indexes together. Deploy step now documented in PHASE_3_NOTES setup. |
| 6 | [StepReviewAndPay.tsx:97-108](website/src/components/booking/StepReviewAndPay.tsx) | Notification failure could roll back a confirmed booking. The outer try/catch on the success path treated any post-`updateStatus('confirmed')` error as payment failure. | Wrapped `notifyBookingConfirmedAction()` in its own try/catch. The guest still sees their confirmation even if email/SMS/alert fails. Belt-and-braces — the action also already uses `Promise.allSettled` internally. |
| 7 | mock files | `console.log` noise in [mockBookingRepo.ts](website/src/lib/services/mocks/mockBookingRepo.ts), [mockPayment.ts](website/src/lib/services/mocks/mockPayment.ts) | Trimmed to a single tagged line each. `mockBookingRepo` is unused (firestoreBookingRepo is wired in) but kept per Phase 3 brief. `mockNotifications` keeps its logs because they're the only visible signal that the SMS/hotel-alert channels are still mocked. |

The Razorpay-orderId placeholder noted in [StepReviewAndPay.tsx:91](website/src/components/booking/StepReviewAndPay.tsx#L91) is documented in Phase 3 NOTES as a "remaining gap" — fixing it requires the real Razorpay flow's shape (`createOrder` actually returning a Razorpay order id and threading it through `verifyPayment`'s signature check). Leaving it untouched per Phase 3's stated Razorpay-phase boundary; it stays documented in "Known remaining gaps" below.

---

## Sub-Phase 2 — Guest confirmation email (Resend)

### How it works

The booking flow now ships a real guest confirmation email — but behaves identically to before when no API key is set. Every booking either sends a real email or prints a preview, never silently drops.

| File | Role |
|---|---|
| [src/emails/BookingConfirmation.tsx](website/src/emails/BookingConfirmation.tsx) | React Email template. Inline-styled table layout for Gmail/Outlook/Apple Mail compatibility. Renders booking ID, stay summary, price breakdown, "what's next", hotel contact, cancellation-policy link, footer. Takes the full `Booking` plus an optional `roomName`. Pure component — no data fetching. |
| [src/lib/services/resendNotifications.ts](website/src/lib/services/resendNotifications.ts) | Implements the existing `NotificationService` interface. `sendGuestEmail` renders the template to HTML and sends via Resend. `sendGuestSMS` and `sendHotelAlert` still delegate to the mock (Phase 4 brief boundary). |
| [src/lib/services/index.ts](website/src/lib/services/index.ts) | One-line swap: `notifications = resendNotifications`. The booking flow's call sites are unchanged because the interface is unchanged. |

### Graceful degradation

When `RESEND_API_KEY` is missing, `sendGuestEmail`:
1. Still renders the React Email template to HTML.
2. Prints a tagged preview block to the server console:
   ```
   ═══ EMAIL PREVIEW (Resend not configured) ═══
     TO: guest@example.com
     FROM: The Blues Hotel Golden Glory <onboarding@resend.dev>
     SUBJECT: Booking Confirmed — BHG-...
     Booking ID: ...
     Guest: ...
     ...
     HTML preview: /path/to/.email-previews/BHG-....html
     To send real emails: set RESEND_API_KEY and EMAIL_FROM in .env.local
   ═══════════════════════════════════════════════
   ```
3. (Dev only) Writes the full HTML to `.email-previews/<bookingId>.html` so the developer can open the file in a browser and see the actual layout. The `.email-previews/` directory is git-ignored.
4. Returns `{ sent: true }` so the booking flow proceeds normally.

When `RESEND_API_KEY` IS set, the same render path runs but the HTML is sent via the Resend SDK. Errors are caught and logged but never thrown — a failed email cannot break a confirmed booking.

### Booking flow integration

`StepReviewAndPay.handlePaymentSuccess`:
1. `verifyPaymentAction` ✓
2. `updateBookingStatusAction(bookingId, 'confirmed')` — Firestore write of the new status
3. `notifyBookingConfirmedAction(bookingId)` wrapped in its own try/catch — fires guest email (real or preview) + still-mocked SMS + still-mocked hotel alert via `Promise.allSettled`
4. `store.reset()` + `router.push(/confirmation)`

If step 3 throws or returns `{ sent: false }`, the guest still reaches their confirmation page.

### RESEND GO-LIVE CHECKLIST

When the developer is ready to switch from preview-mode to real email delivery:

1. **Create a Resend account** at https://resend.com and sign in.
2. **Generate an API key**: Resend dashboard → API Keys → "Create API Key" → give it a name like "Hotel Golden Glory Production" → copy the value (`re_...`).
3. **Add the API key to `.env.local`**:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Pick a sender address** — two paths:
   - **Fast path (works immediately, for testing):** leave `EMAIL_FROM` as the default `"The Blues Hotel Golden Glory <onboarding@resend.dev>"`. Resend allows this sender out of the box but applies low rate limits and adds a disclaimer in the email's footer.
   - **Production path:** verify your sending domain in Resend dashboard → Domains → "Add Domain" → enter `theblueshotels.com` (or whatever the hotel's email domain is) → copy the SPF, DKIM, and DMARC DNS records into the domain's DNS provider → wait for verification (usually 5-30 min). Once verified, set:
     ```
     EMAIL_FROM="The Blues Hotel Golden Glory <reservations.goldenglory@theblueshotels.com>"
     ```
5. **Restart `npm run dev`** so the new env vars are picked up.
6. **Test fire**: make a real booking through `/booking`, simulate success in the mock Razorpay dialog. The console will no longer show the preview block; instead it logs:
   ```
   [resendNotifications] sent BHG-... → guest@example.com (id: re_...)
   ```
   and the email arrives in the guest's inbox within seconds.
7. **Add the same two env vars to your production host** (Vercel/Netlify/etc.) and redeploy.

**That's it. No code changes. The booking flow, template, and call sites are already wired.**

If you ever want to revert to preview mode (e.g. during incident response), just delete or comment out `RESEND_API_KEY` from `.env.local`.

---

## Sub-Phase 3 — Design polish

Polish only — no new pages, no new features, no restructure. Per file:

### Cross-cutting

| Where | What changed |
|---|---|
| [globals.css](website/src/app/globals.css) | Added a global `:focus-visible` ring (gold, 2px, 2px offset) for keyboard users, while suppressing the default `:focus` outline. Form controls (`input/textarea/select`) opt out of the global ring so they don't double up with their own `focus:ring-*` utilities. |
| [globals.css](website/src/app/globals.css) | Added real `@keyframes shake` with a `prefers-reduced-motion` no-op override, so the booking guest-details form's invalid-submit shake actually animates (it didn't before — see Sub-Phase 1 bug #4). |
| Status badges (3 sites) | All three admin status-badge call sites now use the same `wrap + dot + label` pattern with an inset ring, coloured dot, and proper-cased labels ("Awaiting payment" instead of "awaiting payment"). Files: [dashboard](website/src/app/admin/(authenticated)/page.tsx), [bookings table](website/src/app/admin/(authenticated)/bookings/bookings-table.tsx), [booking-status-update](website/src/app/admin/(authenticated)/bookings/[bookingId]/booking-status-update.tsx). |
| Wizard CTAs (4 buttons) | Added shadow + `hover:shadow` + `active:scale-[0.99]` for tactile feedback consistent across the 4 wizard step buttons + the Failed-page retry button. |

### Admin panel

| Where | What changed |
|---|---|
| [Dashboard StatCard](website/src/app/admin/(authenticated)/page.tsx) | Restructured: uppercase label on top, large `font-display tabular-nums` value, optional sub-line, icon moved to top-right. Adds `hover:shadow-md` for affordance. |
| [Dashboard recent-bookings panel](website/src/app/admin/(authenticated)/page.tsx) | New "five most recent reservations" subtitle, proper empty-state with title + body copy instead of a flat sentence. Rows: tighter spacing, truncation on long names, `tabular-nums` on money. |
| [Bookings filter pills](website/src/app/admin/(authenticated)/bookings/bookings-table.tsx) | Added `role="tablist" / role="tab" / aria-selected` semantics, slightly wider padding, hover transition. Empty state upgraded with title + body copy. |
| [Bookings table — Status column](website/src/app/admin/(authenticated)/bookings/bookings-table.tsx) | Adopted the new badge pattern; properly capitalises "Awaiting payment" / "Cancelled" / etc. |
| [BookingStatusUpdate](website/src/app/admin/(authenticated)/bookings/[bookingId]/booking-status-update.tsx) | Pending state now shows a spinner + "Saving…" (was static "Updating…"). Select dropdown labels rewritten to "Change to: Confirmed" for clearer intent. Added `aria-label`. |
| [Booking detail definition list](website/src/app/admin/(authenticated)/bookings/[bookingId]/page.tsx) | All `dt` labels now use the unified "uppercase + tracking-wider + 11px" treatment. Total line uses gold display font + tabular nums for emphasis. |
| [Admin rooms list cards](website/src/app/admin/(authenticated)/rooms/page.tsx) | Hover state lifts the card 0.5px + tints border gold + scales the thumbnail. Meta line gets the uppercase-label treatment. Tagline clamped to 2 lines for consistent card height. |
| [TotalRoomsEditor input](website/src/app/admin/(authenticated)/rooms/[slug]/total-rooms-editor.tsx) | Added `aria-label`, `inputMode="numeric"`, `tabular-nums`, hover-border colour. Container now flex-wraps so the Save button never gets clipped on mobile. |
| [GalleryEditor empty state](website/src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx) | Proper empty state — title + helpful body copy ("the first upload is automatically set as the hero image"), warm background instead of plain bordered box. |
| [AdminSidebar footer](website/src/components/admin/AdminSidebar.tsx) | Signed-in user block redesigned: gold initials avatar + email below. Reads as a deliberate identity chip instead of two stacked lines. |

### Public site

| Where | What changed |
|---|---|
| [MockRazorpayDialog](website/src/components/booking/MockRazorpayDialog.tsx) | Added a small "Dev Preview · Razorpay Mock" label band at the top with the gold accent dot. Outer container uses overflow-hidden so the band flows naturally. Amount now uses `font-display text-3xl`. Booking-ID line uses ShieldCheck icon. "Simulate Failure" button switched to outlined red (less aggressive). Escape-key closes the dialog. Spinner copy normalised to "Processing payment…". |
| [GuestStepper](website/src/components/booking/GuestStepper.tsx) | Tap targets bumped 32px → 36px (closer to the 44px guidance, sufficient on mobile). Added `aria-live="polite"` on the value so screen readers announce changes. `active:scale-95` for tactile feedback. |
| [StepDates "your stay" pill](website/src/components/booking/StepDates.tsx) | Replaced flat "3 nights" text with a centered gold-tinted pill: "Your stay: **3** nights" — more reassuring + visually highlights the calculated value. |
| [ConfirmationContent action grid](website/src/app/(public)/booking/[bookingId]/confirmation/confirmation-content.tsx) | Action cards now lift on hover, icons scale subtly. "Download PDF" label changed to "PDF (soon)" with `border-dashed` to make the disabled state look intentional. |
| [Cancellation policy](website/src/app/(public)/policies/cancellation/page.tsx) and [Privacy policy](website/src/app/(public)/policies/privacy/page.tsx) | Removed the non-functional `prose` class (Tailwind v4 typography isn't installed). Tightened `max-w-3xl` → `max-w-2xl` for healthier line length. Each section now lives in a `<PolicySection>` helper with a top border separator. Added "Last updated · May 2026" eyebrow. Lists use gold markers via `marker:text-gold`. |

### What I did NOT do (per brief: polish only)

- Did not add a shared `<StatusBadge>` component (would be a restructure across 3 files). Kept the `statusStyles` map duplicated but identical.
- Did not change the colour palette, fonts, route structure, or component organisation.
- Did not rebuild the hero or any major section — the brand language is unchanged.
- Did not extract booking-flow component children — the wizard step files stay as-is.

---

## What's still mocked (and where to swap)

| Concern | Status | Where it goes real |
|---|---|---|
| Firestore bookings repo | **REAL** (Phase 3) | — |
| Firestore room overrides incl. rates | **REAL** (Phase 3) | — |
| Real-time availability vs confirmed/awaiting bookings + admin blocks | **REAL** (Phase 3) | — |
| Firebase Auth admin session cookies + custom-claim gate | **REAL** (Phase 3) | — |
| **Guest confirmation EMAIL** | **REAL** (Phase 4) with preview-mode fallback when key unset | `RESEND_API_KEY` + `EMAIL_FROM` env vars — no code change |
| **Guest SMS** | MOCK | `src/lib/services/resendNotifications.ts` — replace `sendGuestSMS: mockNotifications.sendGuestSMS` with a real MSG91 (or other Indian SMS provider) implementation behind the same interface |
| **Hotel-staff alert email** | MOCK | `src/lib/services/resendNotifications.ts` — replace `sendHotelAlert: mockNotifications.sendHotelAlert` with a Resend send (or Slack webhook) to the operations inbox |
| **Razorpay payment** | MOCK (`MockRazorpayDialog`) | Replace `mockPayment` in `src/lib/services/index.ts` with a real `createOrder` calling Razorpay Orders API + signature-verifying `verifyPayment`; replace `MockRazorpayDialog.tsx` with the Razorpay Checkout v1 script loader. Wire the real `orderId` returned from `createPaymentOrderAction` through to `verifyPaymentAction` (currently uses `order_${bookingId}` placeholder — see Phase 3 NOTES). |
| **PDF booking voucher** | NOT BUILT (button shows "PDF (soon)") | New server action that renders a Booking + Room into a PDF (React PDF / Puppeteer) and streams a download. |

---

## Known remaining gaps

1. **Razorpay live integration** — biggest remaining swap. See above row.
2. **Real SMS** — MSG91 (or equivalent) for India.
3. **Real hotel-staff alert** — operations team needs the booking summary too; the mock is a console.log only.
4. **PDF voucher** — the confirmation page button is intentionally disabled ("PDF (soon)" with dashed border now signals that).
5. **Booking reports / analytics dashboard** — current admin dashboard is 4 KPIs + recent-5 list. A reports section (date range, revenue per category, occupancy) is the natural next step.
6. **Bookings table — search, date filter, pagination** — Firestore now backs it, so these are straightforward to add.
7. **Audit log** — admin mutations (status changes, rate edits, blocks, image edits) still only `console.log`. An `audit/` collection capturing `{ actorEmail, action, target, ts, before, after }` would close compliance/accountability for the 2-staff model.
8. **Live Firebase verification of Sub-Phase 0 checks 1–3** — code traces above are sound but the manual checks listed under each item must still be run against a real Firebase project before declaring production-ready.

---

## Build/lint/typecheck gate

```
npm run typecheck   # tsc --noEmit              — clean
npm run lint        # eslint                     — ZERO warnings (was 1 pre-existing)
npm run build       # next build --webpack       — clean, all routes built
```

(filled in at the end)
