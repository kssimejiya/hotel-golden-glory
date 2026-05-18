# Phase 3 — Real Firebase backend, Firebase Auth, admin rate editing, static pages

This phase swaps the mock booking repo for Firestore, replaces the static-password
admin with Firebase Auth (custom-claim gated), adds an admin rate-editor card
that flows through to the booking flow, and ships the cancellation/privacy/contact
pages. The booking wizard's interface (and the entire public site) is unchanged —
all real-backend work happens behind the existing service interfaces.

## Important Next.js 16 note: `proxy.ts`, not `middleware.ts`

The Phase 3 brief said "Delete `proxy.ts` and create `middleware.ts`." That is
correct for Next.js 15 and earlier, but **Next.js 16 renamed Middleware to
Proxy**, and the file convention is now `proxy.ts` (or `src/proxy.ts`).
Functionality is identical. The repo already had `src/proxy.ts` in the right
place — I kept that name and rewrote its contents. The build output confirms
it's wired (`ƒ Proxy (Middleware)` line at the bottom of `next build`).

Source: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`:

> Starting with Next.js 16, Middleware is now called Proxy to better reflect
> its purpose. The functionality remains the same.

This also means the previous Part-C audit note about "proxy.ts not being wired
as middleware" was a misread — it IS wired; the name just changed in Next 16.

---

## Files

### Created (15)
```
website/.env.local.example
website/firestore.rules                                              (project root)
website/storage.rules                                                (project root)
website/src/lib/firebase/client.ts
website/src/lib/services/firestoreBookingRepo.ts
website/src/lib/booking/booking-flow-actions.ts
website/src/app/api/admin/session/route.ts
website/src/app/admin/(authenticated)/rooms/[slug]/rate-editor.tsx
website/src/app/(public)/policies/cancellation/page.tsx
website/src/app/(public)/policies/privacy/page.tsx
website/src/app/(public)/contact/page.tsx
website/scripts/lib/init-admin.ts
website/scripts/set-admin-claim.ts
website/PHASE_3_NOTES.md
```

### Modified (15)
```
website/package.json                                                 (added firebase, typecheck/set:admin scripts)
website/src/lib/firebase/admin.ts                                    (env-var-based init, loud failure)
website/src/lib/firebase/roomRepo.ts                                 (rates is now Firestore-overridable)
website/src/lib/firebase/availabilityRepo.ts                         (subtracts real bookings + admin blocks)
website/src/lib/services/index.ts                                    (real Firestore booking repo)
website/src/lib/booking/pricing.ts                                   (takes Room object, no static lookup)
website/src/lib/admin/session.ts                                     (Firebase session cookies)
website/src/lib/admin/actions.ts                                     (logout only — login moved to client + route handler)
website/src/lib/admin/room-actions.ts                                (verifyAdminSession + updateRoomRatesAction)
website/src/lib/admin/booking-actions.ts                             (added admin check)
website/src/proxy.ts                                                 (lightweight cookie-presence check)
website/src/app/admin/login/page.tsx                                 (redirects when already signed in)
website/src/app/admin/login/login-form.tsx                           (Firebase email+password, error mapping, password reset)
website/src/app/admin/(authenticated)/layout.tsx                     (authoritative verifyAdminSession + redirect)
website/src/app/admin/(authenticated)/rooms/[slug]/page.tsx          (added Rates editor card)
website/src/components/admin/AdminSidebar.tsx                        (shows signed-in email)
website/src/components/booking/BookingWizard.tsx                     (passes rooms to step 4)
website/src/components/booking/StepRoomAndPlan.tsx                   (passes Room object to calculatePricing)
website/src/components/booking/StepReviewAndPay.tsx                  (server actions for booking + payment; receives rooms prop)
website/src/components/booking/BookingSummaryCard.tsx                (no static lookup; takes roomName prop)
website/src/components/layout/Footer.tsx                             (3-col grid, real policy links, no newsletter)
website/src/app/(public)/booking/[bookingId]/confirmation/page.tsx   (server-fetches booking + room name)
website/src/app/(public)/booking/[bookingId]/confirmation/confirmation-content.tsx  (receives booking + roomName props)
website/src/app/(public)/booking/[bookingId]/failed/page.tsx         (server-fetches booking)
website/src/app/(public)/booking/[bookingId]/failed/failed-content.tsx (receives bookingId + booking props)
website/scripts/seed-rooms.ts                                        (uses shared init-admin helper; seeds rates)
website/scripts/upload-static-images.ts                              (uses shared init-admin helper)
```

### Deleted env vars / patterns (no file deleted; references removed)
- `ADMIN_PASSWORD` — gone. Auth is now Firebase email/password.
- `ADMIN_SESSION_SECRET` — gone. Sessions are signed by Firebase, not by us.
- `GOOGLE_APPLICATION_CREDENTIALS` (path-to-JSON) — replaced by discrete
  `FIREBASE_ADMIN_*` env vars so deployment hosts that can't write files
  (Vercel, Render, Cloud Run) can run unchanged.

### Kept for reference (no longer wired)
- `website/src/lib/services/mocks/mockBookingRepo.ts` — left in tree per brief
  for diff readability and easy revert; not imported anywhere.

---

## Developer setup checklist

### 1. Fill `.env.local`

Copy `website/.env.local.example` to `website/.env.local` and fill in:

**Firebase Web SDK** (public values from Firebase Console → Project settings →
General → Your apps → Web app → SDK setup and configuration):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin SDK** (secret values — never expose in client code):
1. Firebase Console → Project settings → **Service accounts** → **Generate new
   private key** → downloads a JSON file.
2. Open the JSON and copy:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (paste the entire string
     including `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`
     markers; escaped `\n` sequences are auto-unescaped by `admin.ts`)
3. Delete the downloaded JSON — you only need it once.

**App**:
- `NEXT_PUBLIC_SITE_URL` — e.g. `http://localhost:3000` for dev, real domain
  for production.

### 2. Enable Firebase services in the console

- **Authentication** → Sign-in method → enable **Email/Password**.
- **Firestore Database** → create the database in production mode (rules are
  deployed in step 4).
- **Storage** → Get started (us-central or your nearest region). Required for
  the GalleryEditor uploads to work.

### 3. Create the 2 staff accounts

In Firebase Console → Authentication → Users → **Add user**:
- Create account #1 with the staff member's work email.
- Create account #2 with the second staff member's email.
- Initial passwords are set here; staff can change them via the
  "Forgot password?" link on the login screen (which sends a Firebase reset
  email).

### 4. Grant admin claim to each account

The `admin: true` custom claim is what unlocks the admin panel. Without it,
sign-in succeeds but the session cookie call (`/api/admin/session`) returns
401 and the cookie is never set.

From the `website/` directory:
```
npx tsx scripts/set-admin-claim.ts staff1@theblueshotels.com
npx tsx scripts/set-admin-claim.ts staff2@theblueshotels.com
```
(or via the shortcut: `npm run set:admin -- staff1@theblueshotels.com`)

To revoke: `npx tsx scripts/set-admin-claim.ts <email> --off`
To force immediate effect on existing sessions: add `--revoke`.

### 5. Deploy security rules

From the repo root (where `firestore.rules` and `storage.rules` live):
```
firebase login                       # one-time
firebase use <your-project-id>       # one-time
firebase deploy --only firestore:rules
firebase deploy --only storage
```

If the `firebase` CLI isn't installed: `npm install -g firebase-tools`.

### 6. Seed Firestore room docs (optional but recommended)

From `website/`:
```
npm run seed:rooms
```
This writes `rooms/{slug}` docs with `totalRooms`, `heroImage`, `gallery`,
and `rates` from `src/lib/content.ts` as the initial Firestore state. It is
idempotent — re-runs skip already-seeded rooms. Without this, the admin
editors still work (overrides are written on first save) but the public
site shows static defaults until you seed or edit each room.

### 7. (Optional) Upload static images to Storage

```
npm run upload:images
```
Migrates everything under `public/images/rooms/` into Firebase Storage and
rewrites `rooms/{slug}.heroImage` / `.gallery` to the Storage URLs.
Idempotent — re-runs skip rooms whose URLs already point at Storage.

---

## Architecture — auth defence in depth

Two layers protect every `/admin/*` route:

| Layer | File | Check | Cost |
|---|---|---|---|
| 1. Proxy (edge-ish) | [src/proxy.ts](website/src/proxy.ts) | Cookie present? | ~free |
| 2. Layout (authoritative) | [src/app/admin/(authenticated)/layout.tsx](website/src/app/admin/(authenticated)/layout.tsx) | `adminAuth.verifySessionCookie(cookie, checkRevoked=true)` + `admin === true` claim | ~80ms first request |

**Why both?**
- Proxy runs on every request to `/admin/*`. If we did the full
  `verifySessionCookie` here, every render — including prefetched ones — would
  pay the firebase-admin round-trip. The proxy keeps a logged-out user from
  even reaching layout rendering.
- The layout is the authoritative check: if a user has a forged or expired
  cookie (so proxy lets them through), the layout will reject it
  cryptographically and `redirect("/admin/login")`. `checkRevoked=true`
  also closes the "I disabled the user account but they had a stale cookie"
  hole.
- Every server action that mutates state also calls `verifyAdminSession()` →
  `requireAdmin()`. So even if both UI layers were bypassed somehow, the
  mutations themselves are guarded.

Firebase Auth in Next.js 16 specifically: the proxy doesn't need to be Edge
runtime in Next 16 (it uses Node.js), so `adminAuth` CAN theoretically run in
the proxy. We still chose the two-layer pattern because (a) it follows the
official guidance in `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
("Optimistic checks with Proxy" + "Data Access Layer" for authoritative work),
(b) it keeps the auth-check off prefetched routes, and (c) it preserves the
ability to swap the proxy to a true Edge runtime later without rewriting the
guards.

---

## What's real vs. still mocked

| Concern | Status | Where to swap |
|---|---|---|
| Firestore room overrides (totalRooms / heroImage / gallery / rates) | **REAL** | `src/lib/firebase/roomRepo.ts` |
| Firestore availability blocks (admin-set) | **REAL** | `src/lib/firebase/availabilityRepo.ts` |
| Real-time availability calc (subtracts confirmed + awaiting_payment bookings AND blocks) | **REAL** | `firestoreAvailability.check()` in same file |
| Firestore bookings collection | **REAL** | `src/lib/services/firestoreBookingRepo.ts` |
| Firebase Auth admin login + session cookies + custom claims | **REAL** | `src/lib/admin/session.ts`, `src/app/api/admin/session/route.ts` |
| Storage upload of room images | **REAL** (was already real in Phase 2) | `src/lib/admin/room-actions.ts` |
| **Payment (Razorpay)** | **MOCK** | `src/lib/services/mocks/mockPayment.ts` → wire real client + verify in `src/lib/booking/booking-flow-actions.ts` and `src/components/booking/MockRazorpayDialog.tsx` |
| **Notifications (Email/SMS/Hotel alert)** | **MOCK** | `src/lib/services/mocks/mockNotifications.ts` → replace with Resend + MSG91 implementations. Swap is a one-line change in `src/lib/services/index.ts` (notifications export). The `NotificationService` interface is unchanged so no callers need to change. |

---

## Manual test checklist (≥ 12 cases)

Setup once per session: with `.env.local` filled and both staff accounts in
place, run `npm run dev` and visit `http://localhost:3000`.

1. **Logged-out admin redirect** — open an incognito window, hit
   `http://localhost:3000/admin/bookings` → should bounce to `/admin/login`.
2. **Staff #1 sign-in** — log in with staff #1 credentials → land on `/admin`
   dashboard, sidebar footer shows `Signed in as <email>`.
3. **Staff #2 sign-in** — log out, log in with staff #2 → same flow, sidebar
   shows their email.
4. **Wrong password** — log out, try sign-in with bad password → red error
   "Invalid email or password." (no Firebase technical jargon leaks).
5. **Account without admin claim** — create a user in the Firebase console
   but skip `set-admin-claim.ts`. Sign in → friendly message "This account is
   not authorised for admin access." and the session cookie is NOT set.
6. **Password reset** — on the login screen click "Forgot password?", enter a
   staff email, click "Send password reset email" → green confirmation banner.
   Check the inbox of that account for the Firebase reset email.
7. **Logout** — click "Sign Out" in the sidebar → redirected to `/admin/login`;
   trying to hit `/admin/bookings` directly bounces back to login.
8. **Booking persists across server restart** — kill `npm run dev`, restart,
   visit `/admin/bookings` → previously-created bookings are still listed
   (proves Firestore persistence, not in-memory mock).
9. **Availability reflects a confirmed booking** — create a booking via
   `/booking` (Deluxe, any dates), simulate success in the mock Razorpay
   dialog. Then start a new booking with overlapping dates and 13 rooms (Deluxe
   has 13 total) → that combination should show "Sold out" (because 13 - 1
   held = 12 left, less than the 13 requested).
10. **Availability reflects an admin block** — as admin, go to `/admin/rooms/blues-suite`,
    in the Availability card block 6 rooms for a 3-day window starting
    tomorrow. Visit `/booking` as a guest, select those dates and 1 room →
    Blues Suite shows "Sold out" (6 blocked, 6 total → 0 left).
11. **Rate edit flows to public page** — admin: `/admin/rooms/deluxe`, in the
    Rates card change EP single from 2799 to 5555, click "Save Rates". Visit
    `/rooms/deluxe` as a guest → the rate card shows ₹5,555 for EP/Single.
12. **Rate edit flows to booking price** — start a new booking, pick Deluxe
    + EP + Single (1 adult) for 1 night → Step 2 "Continue" button preview
    AND Step 4 total reflect the new rate (₹5,555 + 12% GST = ₹6,222).
13. **Cancellation Policy page** — visit `/policies/cancellation` → renders
    with header + footer, breadcrumb, no console errors.
14. **Privacy Policy page** — visit `/policies/privacy` → renders cleanly.
15. **Contact page** — visit `/contact` → all 4 contact blocks render, the
    Google Maps iframe loads showing the hotel address.
16. **No dead nav links** — click every link in the Header (Home / Rooms /
    Contact / Book Now) and Footer (all Quick Links, Contact links, both
    bottom policy links) → none 404. The newsletter input is gone.
17. **(Sanity)** Booking confirmation page shows the room name (proves the
    server-side `roomRepo.getBySlug(booking.roomSlug)` + `roomName` prop
    chain works after the Firestore swap).

---

## Build/lint/typecheck gate

```
npm run typecheck   # tsc --noEmit              — clean
npm run lint        # eslint                     — 1 pre-existing warning (StepRoomAndPlan exhaustive-deps, unchanged from Phase 2B)
npm run build       # next build --webpack       — clean
```

---

## Known remaining gaps (for the next phase)

1. **Razorpay** — mock payment dialog still ships. Real integration needs
   server-side order creation with the Razorpay SDK, signature verification in
   `verifyPaymentAction`, and replacing `MockRazorpayDialog.tsx` with the
   Razorpay Checkout v1 script. The current `bookingId → orderId` mapping in
   `StepReviewAndPay.tsx` (`order_${currentBookingId}`) is a placeholder and
   should use the real orderId returned from `createPaymentOrderAction`.
2. **Notifications** — Resend (email) + MSG91 (SMS) + hotel-alert webhook.
   The mock prints to `console.log`; payloads already match the real shape
   so the swap is implementation-only.
3. **PDF booking voucher** — confirmation page has the "Download PDF" button
   wired but disabled ("Coming soon"). Likely server action generating a PDF
   from the Booking + Room data.
4. **Booking reports / analytics dashboard** — current dashboard shows total /
   confirmed / pending / revenue. A reports section (date range filter,
   revenue per category, occupancy rate, etc.) is the natural next add.
5. **Bookings table UX** — no search, no date-range filter, no pagination.
   With Firestore now backing it, fixing this is straightforward — `orderBy`
   + `startAfter` cursors for paging, `where` filters for status/date.
6. **Audit log** — admin mutations (status changes, rate edits, room block
   changes) only `console.log`. A `audit/` collection capturing
   `{ actorEmail, action, target, timestamp, before, after }` would close
   compliance/accountability for the 2-staff model.
7. **`/admin/(authenticated)/layout.tsx` re-render** — per the Next 16 auth
   guide, layouts don't re-run on client-side navigation. If a session
   expires mid-session, UI keeps rendering until the next mutation
   (which `requireAdmin()` will reject). Acceptable for the 8h cookie window
   but worth a future polish.

---

## What changed from the original Phase-3 brief

- **`proxy.ts` was kept, not deleted/renamed to `middleware.ts`** — Next 16
  renamed the convention. See top of this file for source.
- **`paymentService` calls were also moved to server actions** even though
  the mock is still client-safe. Reason: importing `@/lib/services` from a
  client component pulls in the now-`server-only` `firestoreBookingRepo`,
  which tripped the build. Routing through server actions matches the real
  Razorpay phase's shape anyway, so it's a future-proof refactor.
- **`calculatePricing(slug, ...)` → `calculatePricing(room, ...)`** — the
  previous signature reached into static `content.ts` and silently ignored
  Firestore rate overrides. Now the caller passes the live merged `Room`,
  closing the rate-edit-doesn't-affect-price gap that Sub-Phase 4
  specifically called out.
- **`BookingSummaryCard` no longer calls `getRoomBySlug` directly** — same
  static-leakage fix as above. It now takes an optional `roomName` prop that
  callers resolve from the merged data.
