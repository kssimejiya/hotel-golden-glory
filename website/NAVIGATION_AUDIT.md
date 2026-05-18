# Navigation performance audit

**Measurement frame**: every claim about "fast" or "slow" navigation in this
document is reasoned about / measured against a PRODUCTION build (`npm run
build && npm start`). `npm run dev` (Turbopack) compiles each route on first
visit, so dev navigation is ALWAYS slow on first hit and is a USELESS
performance signal. Fixes target prod behavior; the manual test list at the
bottom must be executed against `npm start`.

---

## Step 1 — Diagnosis

### Per-route table (BEFORE fixes)

`SC` = Server Component · `CC` = wraps a Client Component for rendering · `Sta` = ○ Static (build-time HTML) · `SSG` = ● per-slug prerender · `Dyn` = ƒ rendered on every request.

| Route | Top-level type | Data fetches on render | Mode (build output) | loading.tsx? | Notes |
|---|---|---|---|---|---|
| `/` | SC → CC sections | 1× `roomRepo.list()` | ○ Static | **No** | rooms baked into HTML at build time; revalidatePath bursts cache after admin edits |
| `/rooms` | SC → CC `RoomsListing` | 1× `roomRepo.list()` | ○ Static | **No** | same as above |
| `/rooms/[slug]` | SC → CC `RoomDetail` | 1× `roomRepo.getBySlug()` in `generateMetadata` **+** 1× `roomRepo.list()` in page — **sequential** | ● SSG (4 slugs) | **No** | duplicated work; can consolidate |
| `/booking` | SC → CC `BookingWizard` | 1× `roomRepo.list()` | ○ Static | **No** | static HTML; heavy client JS hydrates the wizard |
| `/booking/[id]/confirmation` | SC → CC `ConfirmationContent` | 1× `bookingRepo.getById()` **+** 1× `roomRepo.getBySlug()` — **sequential** | ƒ Dynamic | **No** | hot path post-booking; two awaits in series |
| `/booking/[id]/failed` | SC → CC `FailedContent` | 1× `bookingRepo.getById()` | ƒ Dynamic | **No** | one fetch only |
| `/contact` | SC | none (LD+JSON only) | ○ Static | **No** | should be instant; no data work |
| `/policies/cancellation` | SC | none | ○ Static | **No** | should be instant |
| `/policies/privacy` | SC | none | ○ Static | **No** | should be instant |
| `/admin` (dashboard) | SC | 1× `bookingRepo.list()` | ƒ Dynamic | **No** | live data — must stay dynamic |
| `/admin/login` | SC | 1× `verifyAdminSession()` (cookie+JWT verify) | ƒ Dynamic | **No** | redirects if already signed in |
| `/admin/bookings` | SC → CC `BookingsTable` | 1× `bookingRepo.list()` | ƒ Dynamic | **No** | live |
| `/admin/bookings/[id]` | SC | 1× `bookingRepo.getById()` | ƒ Dynamic | **No** | live |
| `/admin/rooms` | SC | 1× `roomRepo.list()` | ƒ Dynamic | **No** | overhead from being inside admin (auth) — fine |
| `/admin/rooms/[slug]` | SC | 1× `roomRepo.getBySlug()` **+** 1× `availabilityRepo.getBlocksForRange(90d)` — **sequential** | ƒ Dynamic | **No** | two awaits in series, both Firestore round-trips |

### Layouts

| Layout | Work | Per-nav cost |
|---|---|---|
| `app/layout.tsx` (root) | injects fonts + JSON-LD | static |
| `app/(public)/layout.tsx` | Header + Footer (Header is "use client", Footer is SC) | static |
| `app/admin/layout.tsx` | metadata template only | static |
| `app/admin/(authenticated)/layout.tsx` | `verifyAdminSession()` — one cookie read + one `adminAuth.verifySessionCookie(cookie, true)` call | required for auth; no Firestore, just a JWT round-trip to Google. **Not redundant**, must stay. |

### A — DATA FETCH BLOCKING

Two routes do sequential Firestore awaits that can be parallelized:

| Route | Sequential calls | Fix |
|---|---|---|
| `/booking/[id]/confirmation` | `bookingRepo.getById(bookingId)` → then `roomRepo.getBySlug(booking.roomSlug)` | Cannot fully parallelize: the 2nd call depends on the 1st's result. **Real fix**: route the lookup through the single `roomRepo.list()` we already have for room data, OR cache `getBySlug` so the 2nd hit is instant. Marginal win — leave as-is, document. |
| `/admin/rooms/[slug]` | `roomRepo.getBySlug(slug)` → then `availabilityRepo.getBlocksForRange(...)` | **Independent calls** — wrap in `Promise.all`. |
| `/rooms/[slug]` | `generateMetadata` does `roomRepo.getBySlug(slug)`; page body does `roomRepo.list()`. Both pull from the same Firestore `rooms` collection. | Both can hit the same cached `roomRepo.list()` — duplicates eliminated. Build-time-only cost since this page is SSG. |

Rarely-changing data NOT cached: `roomRepo.list()` / `roomRepo.getBySlug()`. Each call is a Firestore admin SDK round-trip. Static + SSG pages already bake their HTML at build time, so the per-request cost is **zero for prod static routes**. But ISR is still worth setting explicitly so the HTML refreshes if admin forgets to trigger `revalidatePath`.

Booking & availability data MUST NOT be cached — they're live.

### B — MISSING `loading.tsx` (THE BIG ONE)

**Every route is missing loading.tsx. ZERO loading.tsx files in the project.**

Impact varies by route:
- Static pages (`/`, `/rooms`, `/rooms/[slug]`, `/booking`, `/contact`, `/policies/*`): the HTML is prerendered, so the navigation Just Works fast in prod IF the user already has the client bundle. First navigation to a route loads its JS chunk — without `loading.tsx`, the browser shows the previous page until the chunk arrives. With `loading.tsx`, the user sees an instant skeleton.
- Dynamic admin routes (`/admin/*`): every navigation hits Firestore. Without `loading.tsx` the screen freezes for the duration of the query. With one, the user sees a skeleton.
- Booking-flow dynamic routes (`/booking/[id]/{confirmation,failed}`): same — every navigation hits Firestore.

This is the #1 perceived-slowness cause. Fix is high-leverage and low-risk.

### C — PREFETCH

Audited: all `<Link>` callers use the default `prefetch={true}` (the new
default in Next 16). Zero `<a href="/...">` for internal routes. Zero
`prefetch={false}`. Programmatic `router.push` is used in three places, all
legitimate post-action redirects (not regular navigation):

| File | Use | Verdict |
|---|---|---|
| [failed-content.tsx:19,26](src/app/(public)/booking/[bookingId]/failed/failed-content.tsx#L19) | retry → /booking | post-error retry, not regular nav |
| [StepReviewAndPay.tsx:112-127](src/components/booking/StepReviewAndPay.tsx#L112) | post-payment confirmation/failed | post-action, must be programmatic |
| [login-form.tsx:86](src/app/admin/login/login-form.tsx#L86) | post-sign-in `/admin` | post-action, must be programmatic |

**No prefetch fixes needed.**

### D — RENDER MODE MISMATCH

| Route | Current | Should be | Action |
|---|---|---|---|
| `/` | Static | Static ✓ | none |
| `/rooms` | Static | Static + ISR backstop (1h) | add `export const revalidate = 3600` |
| `/rooms/[slug]` | SSG | SSG + ISR backstop (1h) | add `export const revalidate = 3600` |
| `/contact` | Static | Static ✓ | none |
| `/policies/*` | Static | Static ✓ | none |
| `/booking` | Static | Static ✓ | none |
| `/booking/[id]/*` | Dynamic | Dynamic ✓ — live booking data | none |
| `/admin/*` | Dynamic | Dynamic ✓ — auth + live data | none |

ISR backstop on `/rooms` + `/rooms/[slug]`: the admin already calls
`revalidatePath` on every room edit, so the cache is correct in normal
operation. The 1-hour ISR is insurance against a missed revalidate (e.g.
if a future code path mutates rooms without calling revalidatePath).

### E — CLIENT BUNDLE

| Route | Heavy client deps | Action |
|---|---|---|
| `/` | RoomCategoriesPreview, DiningPreview, TestimonialsSection, ContactCTA — all use framer-motion | acceptable; needed for first paint |
| `/rooms/[slug]` | RoomDetail (use client) + Framer Motion + RoomGalleryHero | acceptable; gallery is the focal point |
| **`/booking`** | BookingWizard imports ALL 4 steps + MockRazorpayDialog up front. User only sees step 1 on first paint. | **Code-split step 2 → 4 + MockRazorpayDialog via `next/dynamic`**. Cuts initial JS for /booking. |
| `/admin/rooms/[slug]` | TotalRoomsEditor + RateEditor + GalleryEditor + AvailabilityEditor — all "use client" | acceptable for admin (small audience, all needed) |
| Booking confirmation | ConfirmationContent + Framer Motion | acceptable; success page is the destination |

---

## Step 2 — Fixes applied

### 2.1 `loading.tsx` skeletons (every route segment)

**The biggest perceived-speed win.** A route segment with no `loading.tsx`
shows the OLD page until the new RSC payload arrives — looks frozen. With
`loading.tsx`, the user sees a tailored skeleton **the instant the Link is
clicked**, then content swaps in.

Shared primitives: [src/components/shared/Skeletons.tsx](src/components/shared/Skeletons.tsx)
(`SkelLine`, `SkelImage`, `PageHeroSkeleton`, `RoomCardSkeleton`,
`AdminPageHeaderSkeleton`, `TableRowSkeleton`). Extended
[src/components/shared/Shimmer.tsx](src/components/shared/Shimmer.tsx) with
an optional `style` prop for arbitrary widths.

| File | Mocks |
|---|---|
| [src/app/(public)/loading.tsx](src/app/(public)/loading.tsx) | Default public skeleton (hero band + content lines) — fallback for any public route without a tailored one |
| [src/app/(public)/rooms/loading.tsx](src/app/(public)/rooms/loading.tsx) | PageHero + 2-col grid of 4 RoomCardSkeletons |
| [src/app/(public)/rooms/[slug]/loading.tsx](src/app/(public)/rooms/[slug]/loading.tsx) | PageHero + gallery (main + 2×2 thumbs) + 2-col content/rate-card |
| [src/app/(public)/booking/loading.tsx](src/app/(public)/booking/loading.tsx) | PageHero + 4-step stepper + step 1 form skeleton |
| [src/app/(public)/booking/[bookingId]/confirmation/loading.tsx](src/app/(public)/booking/[bookingId]/confirmation/loading.tsx) | Success icon + headline + summary card + 4 action tiles |
| [src/app/(public)/booking/[bookingId]/failed/loading.tsx](src/app/(public)/booking/[bookingId]/failed/loading.tsx) | Error icon + message + retry button |
| [src/app/admin/(authenticated)/loading.tsx](src/app/admin/(authenticated)/loading.tsx) | Default admin skeleton (page header + 4 stat cards + content slab) |
| [src/app/admin/(authenticated)/bookings/loading.tsx](src/app/admin/(authenticated)/bookings/loading.tsx) | Header + filter pill bar + table header + 8 row skeletons |
| [src/app/admin/(authenticated)/bookings/[bookingId]/loading.tsx](src/app/admin/(authenticated)/bookings/[bookingId]/loading.tsx) | Back link + header + 3 info cards with dl skeletons |
| [src/app/admin/(authenticated)/rooms/loading.tsx](src/app/admin/(authenticated)/rooms/loading.tsx) | Header + 2-col grid of 4 room-card skeletons (image + meta) |
| [src/app/admin/(authenticated)/rooms/[slug]/loading.tsx](src/app/admin/(authenticated)/rooms/[slug]/loading.tsx) | Back link + header + 4 editor section cards |
| [src/app/admin/login/loading.tsx](src/app/admin/login/loading.tsx) | Centered card with form-field skeletons (fills the redirect-check gap) |

11 new `loading.tsx` files. All use the existing Shimmer (CSS animation,
reduced-motion safe). No new animation patterns introduced.

### 2.2 ISR backstop on the public room pages

| File | Change |
|---|---|
| [src/app/(public)/rooms/page.tsx](src/app/(public)/rooms/page.tsx) | Added `export const revalidate = 3600;` |
| [src/app/(public)/rooms/[slug]/page.tsx](src/app/(public)/rooms/[slug]/page.tsx) | Added `export const revalidate = 3600;` |

Build output confirms both routes are now Static / SSG with `Revalidate: 1h,
Expire: 1y`. The admin's existing `revalidatePath('/rooms')` etc. calls
still bust the cache instantly on edits — the 1h ISR is the backstop for
any future code path that mutates rooms without calling revalidatePath.

Marketing pages (`/`, `/contact`, `/policies/*`) were ALREADY Static — no
change needed. Confirmed in the build output below.

Booking + admin pages: intentionally NOT cached — live data must stay live.

### 2.3 Parallelized sequential fetches + per-request memoization

| File | Change |
|---|---|
| [src/app/admin/(authenticated)/rooms/[slug]/page.tsx](src/app/admin/(authenticated)/rooms/[slug]/page.tsx) | `roomRepo.getBySlug(slug)` and `availabilityRepo.getBlocksForRange(...)` are now wrapped in `Promise.all`. They're independent reads — the page now waits MAX(t_room, t_blocks) instead of t_room + t_blocks. |
| [src/lib/firebase/roomRepo.ts](src/lib/firebase/roomRepo.ts) | `list()` and `getBySlug()` wrapped in React's `cache()`. Within a single request, repeat calls share one Firestore round-trip — covers the `/rooms/[slug]` case where `generateMetadata` + the page body both want room data. |

`/booking/[id]/confirmation` could not be parallelized — its second fetch
(`roomRepo.getBySlug(booking.roomSlug)`) depends on the first's result.
Documented in Step 1 finding A; left as sequential.

### 2.4 `<Link>` / prefetch audit

Already clean — every internal nav uses `<Link>` with default `prefetch={true}`.
Three `router.push` call sites all genuinely programmatic (post-payment
redirect, post-login redirect, retry button). No change.

### 2.5 Code-split the booking wizard

| File | Change |
|---|---|
| [src/components/booking/BookingWizard.tsx](src/components/booking/BookingWizard.tsx) | `StepRoomAndPlan`, `StepGuestDetails`, `StepReviewAndPay` switched to `next/dynamic` (`ssr: false`). Only `StepDates` (the first paint) ships in the initial /booking chunk. |
| [src/components/booking/StepReviewAndPay.tsx](src/components/booking/StepReviewAndPay.tsx) | `MockRazorpayDialog` switched to `next/dynamic` (`ssr: false`). Chunk loads when the user clicks Pay — by then it's hidden behind the processing-state spinner anyway. |

Each step's 250ms slide-in transition (from AnimatePresence) is long enough
to hide the chunk fetch on any reasonable connection. Re-visits within the
same session hit the chunk cache and are instant.

### 2.6 Admin auth check

[src/lib/admin/session.ts](src/lib/admin/session.ts) — `verifyAdminSession`
wrapped in React's `cache()`. Today the layout is the only call site per
navigation, so this is defensive: any future page or server component in
the same request that needs the user email gets it for free. The auth check
itself is unchanged — still one cookie read + one
`adminAuth.verifySessionCookie(cookie, checkRevoked=true)` call. Cannot be
trimmed further without weakening security.

---

## Step 3 — After-fix verification

### Build output (production)

```
Route (app)                            Revalidate  Expire
┌ ○ /                                       (Static)
├ ○ /_not-found
├ ƒ /admin                                  (Dynamic — auth + live data)
├ ƒ /admin/bookings
├ ƒ /admin/bookings/[bookingId]
├ ƒ /admin/login
├ ƒ /admin/rooms
├ ƒ /admin/rooms/[slug]
├ ƒ /api/admin/session
├ ○ /booking                                (Static — wizard hydrates)
├ ƒ /booking/[bookingId]/confirmation       (Dynamic — live booking)
├ ƒ /booking/[bookingId]/failed
├ ○ /contact                                (Static)
├ ○ /policies/cancellation                  (Static)
├ ○ /policies/privacy                       (Static)
├ ○ /rooms                                     1h      1y   ← ISR
└ ● /rooms/[slug]                              1h      1y   ← SSG + ISR
  ├ /rooms/deluxe                              1h      1y
  ├ /rooms/superior                            1h      1y
  ├ /rooms/premium                             1h      1y
  └ /rooms/blues-suite                         1h      1y

ƒ Proxy (Middleware)
○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Every page is in its correct mode. No marketing page is unnecessarily Dynamic;
no live-data page is incorrectly Static.

### Per-route BEFORE → AFTER

| Route | Mode (before) | Mode (after) | Sequential awaits (before) | After | loading.tsx |
|---|---|---|---|---|---|
| `/` | ○ Static | ○ Static | 1 | 1 (memoized) | + default public |
| `/rooms` | ○ Static | ○ Static + ISR 1h | 1 | 1 (memoized) | + tailored |
| `/rooms/[slug]` | ● SSG | ● SSG + ISR 1h | metadata 1 + page 1 (2 total) | 1 + 1, deduped via `cache()` per request | + tailored |
| `/booking` | ○ Static | ○ Static | 1 | 1 (memoized) | + tailored |
| `/booking/[id]/confirmation` | ƒ Dynamic | ƒ Dynamic | 2 sequential | 2 (dependent, kept) | + tailored |
| `/booking/[id]/failed` | ƒ Dynamic | ƒ Dynamic | 1 | 1 | + tailored |
| `/contact` | ○ Static | ○ Static | 0 | 0 | (uses default) |
| `/policies/*` | ○ Static | ○ Static | 0 | 0 | (uses default) |
| `/admin` | ƒ Dynamic | ƒ Dynamic | 1 | 1 | + default admin |
| `/admin/login` | ƒ Dynamic | ƒ Dynamic | 1 (session check) | 1 (memoized) | + tailored |
| `/admin/bookings` | ƒ Dynamic | ƒ Dynamic | 1 | 1 | + tailored |
| `/admin/bookings/[id]` | ƒ Dynamic | ƒ Dynamic | 1 | 1 | + tailored |
| `/admin/rooms` | ƒ Dynamic | ƒ Dynamic | 1 | 1 (memoized) | + tailored |
| `/admin/rooms/[slug]` | ƒ Dynamic | ƒ Dynamic | **2 sequential** | **2 parallel** (Promise.all) | + tailored |

### MANUAL TEST LIST (developer must run against `npm run build && npm start`)

**Do NOT measure against `npm run dev`** — Turbopack compiles routes on
demand in dev, so first-visit speed is meaningless. Always test prod.

1. **Click through every nav link** (Home → Rooms → a Room → Booking →
   Contact → a Policy → back home). Each click should show its skeleton
   IMMEDIATELY (no frozen blank), then content streams in. The skeleton
   shimmer should match the eventual layout — no jarring layout shift.
2. **Room A → back → Room B**: the second navigation should feel
   noticeably faster than the first. The first paid the ISR build + chunk
   load; the second hits the prefetched chunk + cached HTML.
3. **Admin nav** (`/admin` → `/admin/bookings` → click a booking → back →
   `/admin/rooms` → click a room → save a rate). Each navigation shows the
   admin skeleton instantly; data swaps in. Admin auth check stays under
   ~200ms per nav.
4. **DevTools → Network → with throttling off**: hover a `<Link>` →
   confirm an RSC payload prefetch fires (you'll see a request to the
   route's path with `?_rsc=…`). Click → the navigation uses the prefetched
   payload, near-instant.
5. **Build output sanity** (already verified above, repeat after any
   future PR): `/` `/rooms` `/rooms/[slug]` `/booking` `/contact`
   `/policies/*` are Static or SSG (○ or ●). Anything Dynamic (ƒ) that
   shouldn't be is a regression.
6. **Booking wizard chunk-split**: load `/booking` → DevTools → Network →
   filter JS → confirm the initial chunk does NOT contain "StepReviewAndPay"
   or "MockRazorpayDialog" symbols. Advance to step 2 → a new JS chunk
   loads. Continue through to step 4 → MockRazorpayDialog chunk loads only
   when "Pay" is clicked.
7. **prefers-reduced-motion: reduce**: shimmer fallback in every
   `loading.tsx` becomes a static cream tile (no sweep animation). Skeletons
   still appear; no jank.

### What did NOT change

- The auth check stays at one cookie read + one Firebase admin verify —
  this is the minimum for security and must not be removed for speed.
- Booking and availability data are NOT cached — live data correctness
  wins. Admin pages stay Dynamic.
- No `revalidatePath` calls in admin actions changed; the existing ones
  still bust the new ISR cache on edits.
- No layout/visual changes — all skeletons use existing Shimmer + design
  tokens.

### Known limits / next steps (out of scope here)

1. **`/booking/[id]/confirmation`'s two-step fetch** (getById → getBySlug)
   could be consolidated if the booking doc stored the room name alongside
   `roomSlug`. Today's marginal: it's already covered by a tailored
   `loading.tsx` so the user sees a polished placeholder instead of waiting.
2. **Admin dashboard's recent-bookings query** could be `limit(5)` instead
   of `bookingRepo.list().slice(0, 5)` (currently fetches all bookings
   then trims). As booking volume grows, the full-list scan will dominate.
3. **HTTP cache headers** for the Firebase Storage CDN are already
   `max-age=31536000 immutable` (Phase 7); no change there.
