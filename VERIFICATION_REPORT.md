# Consolidated Verification Report

Generated: 2026-05-24
Scope: Phases 3, 4, 5, Image Audit, and 7 — all unverified runtime claims.

---

## Static Audit Results

Every claim across 5 prior phase reports was classified as:
- **Code-trace** — provable by reading the source; audited now.
- **Runtime** — requires a running browser or dev server; deferred to Developer Manual Test Plan.
- **Dev-action** — requires real Firebase credentials and/or external services; deferred with exact steps.

| Phase | Check | Method | Result | Evidence |
|-------|-------|--------|--------|----------|
| 3 | 3.1 firestoreBookingRepo.create() doc shape | Code-trace | **PASS** | `firestoreBookingRepo.ts:35-51` — spreads NewBooking + bookingId + status + Timestamp.now() + cancellationPolicy; writes via `.doc(bookingId).set()` |
| 3 | 3.2 Availability: single booking reduces inventory by 1 | Code-trace | **PASS** | `availabilityRepo.ts:110-112,153-158` — per-date `held += rooms`, `avail = total - blocked - held`, min across nights |
| 3 | 3.3 Multi-night overlap: May 20-22 vs May 21-23 | Code-trace | **PASS** | `availabilityRepo.ts:21-29,108,110-113` — night 21 held=1 (checkIn<=21 && 21<checkOut), night 22 held=0 (22<22 is false). No off-by-one. |
| 3 | 3.4 Rate flow: reads Firestore-merged Room, not content.ts | Code-trace | **PASS** | `pricing.ts:1,21` — zero imports from content.ts; reads `room.rates.find()` from the passed Room object. Call chain: `booking/page.tsx:14` → `roomRepo.list()` (merges Firestore overrides at `roomRepo.ts:130-140`) → BookingWizard → StepRoomAndPlan → `calculatePricing(selectedRoom, ...)` |
| 3 | 3.5 Admin claim gate: user without admin:true cannot reach /admin/* | Code-trace | **PASS** | Two gates: `session.ts:50` rejects `decoded.admin !== true` at cookie mint time; `session.ts:101` re-checks in `verifyAdminSession()` called by `layout.tsx:15`. Proxy at `proxy.ts:35-39` is a fast presence-only check (no crypto). |
| 4 | 4.1 Graceful degradation: no-key → preview, with-key → real Resend | Code-trace | **PASS** | `resendNotifications.ts:25,33-37,110-131,134-150` — `getResend()` returns null when `!RESEND_API_KEY`; null triggers console preview + HTML file; non-null triggers `resend.emails.send()` |
| 4 | 4.2 Email sent AFTER status=confirmed, never before | Code-trace | **PASS** | `StepReviewAndPay.tsx:129` awaits `updateBookingStatusAction("confirmed")` first; `StepReviewAndPay.tsx:135` calls `notifyBookingConfirmedAction` second |
| 4 | 4.3 Email failure does NOT roll back booking | Code-trace | **PASS** | Triple isolation: (1) `StepReviewAndPay.tsx:135-141` wraps notify in its own try/catch, catch only logs. (2) `booking-flow-actions.ts:76` uses `Promise.allSettled`. (3) `resendNotifications.ts:152-158` catches and returns `{sent:false}`, never throws. |
| 4 | 4.4 BookingConfirmation.tsx renders complete data | Code-trace | **PASS** | All fields from `Booking` type used; currency via `Intl.NumberFormat("en-IN", {style:"currency",currency:"INR"})` at line 32; dates via `Intl.DateTimeFormat("en-IN")` at line 42; bookingId at lines 209,465; guest name via `firstName()` at line 187. Optional `roomName` falls back to `booking.roomSlug`. |
| 5/Audit | Bug #1: Cached-image SSR rescue | Code-trace | **PASS** | `SmartImage.tsx:140-146` — ref callback checks `img.complete && img.naturalWidth > 0` at attach time |
| 5/Audit | Bug #2: duration-400 → duration-500 | Code-trace | **PASS** | `SmartImage.tsx:245,294` — both paths use `duration-500` |
| 5/Audit | Bug #3: Stuck error on src change | Code-trace | **PASS** | `SmartImage.tsx:128-133` — in-render `trackedIdentity` comparison resets `loaded`/`errored` |
| 5/Audit | Bug #4: metadataBase for OG images | Code-trace | **PASS** | `layout.tsx:42-43,46` — `metadataBase: new URL(NEXT_PUBLIC_SITE_URL)` |
| 5/Audit | Bug #5: DiningPreview blur placeholder | Code-trace | **PASS** | `DiningPreview.tsx:21-22,63-64` — `DINING_BLUR_DATA_URL` constant + `placeholder="blur"` |
| 7 | SmartImage: fill/width mutual exclusivity | Code-trace | **PASS** | `SmartImage.tsx:99-104,265-270` — `isFill` gates all sizing; discriminated union for next/image |
| 7 | SmartImage: native `<picture>` with AVIF+WebP sources | Code-trace | **PASS** | `SmartImage.tsx:214-216` — `<source>` for avif + webp inside `<picture>` when `hasVariants` |
| 7 | SmartImage: legacy fallback when no variants | Code-trace | **PASS** | `SmartImage.tsx:261-311` — falls back to `<Image>` from next/image |
| 7 | SmartImage: preload → fetchpriority="high" | Code-trace | **PASS** | `SmartImage.tsx:190,240` — `eager` flag drives `fetchpriority: "high"` on picture path |
| All | Build / lint / typecheck | Code-trace | **PASS** | `tsc --noEmit` clean, `eslint` zero warnings, `next build` clean |

**Summary: 19 static checks, 19 PASS, 0 FAIL.**

---

## Fixes Applied

No fixes were required. All 19 static audit checks passed on the current codebase.

---

## Developer Manual Test Plan

### Helper scripts

All scripts run from the `website/` directory and require `.env.local` with valid `FIREBASE_ADMIN_*` credentials.

| Script | Command | Purpose |
|--------|---------|---------|
| Seed test data | `npx tsx scripts/verification/seed-test-data.ts` | Creates `BHG-TEST-0001` booking in Firestore (idempotent) |
| Check availability | `npx tsx scripts/verification/check-availability.ts <slug> <checkIn> <checkOut>` | Prints per-night inventory breakdown against real Firestore |
| Send test email | `npx tsx scripts/verification/send-test-email.ts [email]` | Sends real email (if RESEND_API_KEY set) or writes HTML preview |
| Clear test data | `npx tsx scripts/verification/clear-test-data.ts` | Removes only verification-seeded data |

---

### Session A — Firebase data layer + booking persistence (~30 min)

**Prerequisites:** `.env.local` filled with Firebase Admin credentials. `npm run seed:rooms` run at least once.

- [ ] **A1. Seed test booking**
  - Run: `npx tsx scripts/verification/seed-test-data.ts`
  - Expected: Terminal prints `✓ Created test booking: BHG-TEST-0001` with room, dates, guest details.
  - Verify in Firebase Console: Firestore → `bookings` → `BHG-TEST-0001` document exists with all fields.

- [ ] **A2. Booking persistence across restart**
  - Run: `npm run dev`, visit `http://localhost:3000/admin/bookings/BHG-TEST-0001`
  - Expected: Booking detail page renders with guest name "Test Guest Verification", dates June 15–17, total ₹7,838.
  - Kill dev server (`Ctrl+C`), restart `npm run dev`, reload the same page.
  - Expected: Same data still renders. This proves Firestore persistence (not in-memory mock).

- [ ] **A3. Availability check — seeded booking reduces inventory**
  - Run: `npx tsx scripts/verification/check-availability.ts deluxe 2026-06-15 2026-06-17`
  - Expected: Per-night table shows `Held=1` for June 15 and June 16 (from the test booking). `Remaining = totalRooms - 1` on those nights.

- [ ] **A4. Availability — multi-night overlap math**
  - Run: `npx tsx scripts/verification/check-availability.ts deluxe 2026-06-16 2026-06-18`
  - Expected: June 16 shows `Held=1` (overlaps test booking). June 17 shows `Held=0` (test booking checks out June 17).
  - This proves the off-by-one-free overlap math from check 3.3.

- [ ] **A5. Booking created via UI persists**
  - In browser: go to `http://localhost:3000/booking`, complete a full booking (any room, any dates).
  - Simulate success in mock Razorpay dialog.
  - Expected: Redirected to confirmation page showing booking ID, room name, dates, pricing.
  - Run: `npx tsx scripts/verification/check-availability.ts <slug> <checkIn> <checkOut>` with the dates you just booked.
  - Expected: The booking shows up in `Held` column.

- [ ] **A6. Rate edit flows to booking price**
  - As admin: visit `/admin/rooms/deluxe`, in Rates card change EP Single to 5555, click Save.
  - As guest: start new booking → Deluxe → EP → Single → 1 night.
  - Expected: Step 2 preview AND Step 4 total show ₹5,555 base + 12% GST = ₹6,222 total.
  - **Restore the rate** after testing.

- [ ] **A7. Clean up**
  - Run: `npx tsx scripts/verification/clear-test-data.ts`
  - Expected: `✓ Deleted test booking: BHG-TEST-0001`

---

### Session B — Auth, admin claim gating, middleware (~30 min)

**Prerequisites:** Two staff accounts created in Firebase Auth. At least one has `admin:true` claim (via `npm run set:admin`). One test account WITHOUT the admin claim.

- [ ] **B1. Logged-out redirect**
  - Open incognito window → `http://localhost:3000/admin/bookings`
  - Expected: Redirected to `/admin/login`. No flash of admin content.

- [ ] **B2. Staff sign-in (admin claim present)**
  - Log in with a staff account that has `admin:true`.
  - Expected: Land on `/admin` dashboard. Sidebar footer shows `Signed in as <email>`.

- [ ] **B3. Wrong password**
  - Log out, attempt sign-in with incorrect password.
  - Expected: Red error "Invalid email or password." — no Firebase jargon.

- [ ] **B4. Account without admin claim**
  - Sign in with the test account that does NOT have `admin:true`.
  - Expected: "This account is not authorised for admin access." message. No session cookie set (DevTools → Application → Cookies → no `admin-session`).

- [ ] **B5. Password reset flow**
  - On login screen → "Forgot password?" → enter staff email → click send.
  - Expected: Green confirmation banner. Check inbox for Firebase reset email.

- [ ] **B6. Logout**
  - Sign in as admin, then click "Sign Out" in sidebar.
  - Expected: Redirected to `/admin/login`. Attempting `/admin/bookings` directly bounces back to login.

- [ ] **B7. Admin mutation guard**
  - Confirm that server actions are guarded: as a non-admin (or logged out), attempt to call an admin action via DevTools console or direct fetch.
  - Expected: 401 or redirect. No mutation occurs.

---

### Session C — Email send (~20 min)

**Prerequisites:** `.env.local` with Firebase Admin credentials.

- [ ] **C1. Preview mode (no RESEND_API_KEY)**
  - Ensure `RESEND_API_KEY` is NOT set in `.env.local`.
  - Run: `npx tsx scripts/verification/send-test-email.ts`
  - Expected: Terminal prints "RESEND_API_KEY not set — writing preview to disk" and writes `.email-previews/verification-test.html`.
  - Open the HTML file in a browser.
  - Expected: Email renders with booking ID "BHG-TEST-EMAIL", guest "Verification Test Guest", dates July 1–3, total ₹7,838 with ₹ formatting, full layout with header/body/footer.

- [ ] **C2. Preview via full booking flow**
  - Start `npm run dev` (still no RESEND_API_KEY).
  - Complete a booking through `/booking` → simulate success in mock Razorpay.
  - Expected: Server console shows the `═══ EMAIL PREVIEW (Resend not configured) ═══` block with booking summary. Guest still reaches confirmation page.

- [ ] **C3. Real email send (with RESEND_API_KEY)**
  - Set `RESEND_API_KEY=re_...` in `.env.local`.
  - Run: `npx tsx scripts/verification/send-test-email.ts your-real-email@example.com`
  - Expected: Terminal prints `✓ Email sent successfully!` with Resend ID.
  - Check inbox (and spam/junk) for the email.
  - Expected: Email arrives with correct layout, booking details, ₹ formatting, dates.

- [ ] **C4. Email failure does not break booking**
  - Set `RESEND_API_KEY` to an invalid value (e.g., `re_invalid_key`).
  - Complete a booking through the UI → simulate success.
  - Expected: Server console logs a Resend error, BUT the guest still reaches the confirmation page. Booking status is "confirmed" in Firestore.
  - Restore the correct API key (or remove it) after testing.

---

### Session D — Image pipeline (~30 min)

**Prerequisites:** Dev server running. Chrome DevTools open.

- [ ] **D1. Blur-first paint (throttled)**
  - DevTools → Network → Throttle to "Slow 4G".
  - Reload `/rooms/deluxe`.
  - Expected: Gallery images show blur placeholder instantly (no blank gap). Sharp image fades in over ~500ms as it streams.
  - Click thumbnails → same blur-first behavior for each swap.

- [ ] **D2. Listing page blur**
  - Still throttled → reload `/rooms`.
  - Expected: 4 room cards show blur immediately. First 2 cards finish loading first (preload hint).

- [ ] **D3. Homepage categories blur**
  - Reload `/` → scroll to room categories section.
  - Expected: 4 category cards show blur (or shimmer if pre-migration).

- [ ] **D4. Image format verification**
  - DevTools → Network → Img filter → unthrottle → reload any room page.
  - For Phase-7 migrated images: requests go directly to `firebasestorage.googleapis.com` (NOT `/_next/image`). Content-Type is `image/avif` on Chrome.
  - For legacy images: requests go through `/_next/image?url=...&w=...&q=...`. Content-Type is `image/avif` or `image/webp`.

- [ ] **D5. Cached reload — no stuck opacity-0**
  - Ensure "Disable cache" is UNCHECKED in DevTools.
  - Reload `/rooms` twice.
  - Expected: Second load → images appear immediately (from cache). No images stuck invisible at opacity-0. This proves the ref-callback cached-image rescue (bug fix #1).

- [ ] **D6. Error fallback**
  - DevTools → Network → "Block request URL" → block one image URL.
  - Reload the page.
  - Expected: Blocked image shows a cream tile with a faded `ImageOff` icon. Never a browser broken-image glyph.
  - Remove the block after testing.

- [ ] **D7. OG share preview**
  - Ensure `NEXT_PUBLIC_SITE_URL` is set to a reachable URL (e.g., ngrok tunnel).
  - Paste `<your-url>/rooms/deluxe` into Slack/WhatsApp/Twitter or test with an OG preview tool.
  - Expected: Preview shows the room hero image. Not broken. This validates the `metadataBase` fix (bug #4).

- [ ] **D8. Reduced motion**
  - DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`.
  - Reload a room detail page.
  - Expected: Ken Burns animation stopped. Gallery swap is instant (no cross-fade). Shimmer is a static cream tile (no sweep).

- [ ] **D9. CLS check**
  - Run Lighthouse on `/rooms/deluxe` (or `/rooms`).
  - Expected: CLS < 0.1. All fill images sit in aspect-ratio containers.

- [ ] **D10. Admin upload generates variants**
  - As admin: `/admin/rooms/<slug>` → upload a new image.
  - Expected: Server log shows variant generation. In Firebase Console → Storage → `rooms/{slug}/{imageId}/` → contains `original.{ext}` + `2400.avif` + `2400.webp` + smaller sizes.
  - Gallery editor shows the new entry with blur (no amber "Legacy" pill).

- [ ] **D11. Mobile 390px sweep**
  - DevTools → device emulation at 390×844 (iPhone 14).
  - Walk: `/`, `/rooms`, `/rooms/deluxe`, `/booking`, `/admin/rooms`.
  - Expected: No horizontal scroll. No images broken out of containers. Tap targets ≥36px.

---

## Razorpay Readiness Gate

Before Razorpay integration begins, **all** of the following must be ticked off:

- [ ] All Session A tests pass (Firebase data layer + booking persistence)
- [ ] All Session B tests pass (Auth + admin claim gating + middleware)
- [ ] All Session C tests pass (Email send — at least preview mode; ideally one real send)
- [ ] All Session D tests pass (Image pipeline — blur, formats, cache, errors)
- [ ] At least one real test booking persisted across server restart (A2)
- [ ] At least one real confirmation email received in a real inbox (C3)
- [ ] Firestore security rules deployed and inspected — `bookings` collection denies client SDK writes
  - Deploy: `firebase deploy --only firestore:rules` from repo root
  - Verify: Firebase Console → Firestore → Rules → confirm `bookings` match block does not allow `write` from client
- [ ] `FIREBASE_ADMIN_*` env vars present in deployment environment (Vercel/etc.), not just local
  - Verify: deployment platform dashboard → Environment Variables → confirm `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` are set
  - Verify: `NEXT_PUBLIC_FIREBASE_*` public vars are also set
  - Verify: `NEXT_PUBLIC_SITE_URL` is set to the production domain

---

*Report generated by consolidated verification pass. No new features added. No code changes required — all static checks passed.*
