# Phase 2A — Rooms Listing & Detail Pages

## What's Built

### Extended Data Model (`src/types/index.ts`)
- `MealPlan` type: `'EP' | 'CP' | 'MAP'`
- `RoomSlug` type: `'deluxe' | 'superior' | 'premium' | 'blues-suite'`
- `RoomRate` interface: plan + single/double pricing
- `RoomAmenity` interface: icon name + label
- Full `Room` interface: slug, name, shortName, tagline, description, sqft, totalRooms, hasBalcony, maxOccupancy, bedConfiguration, rates[], amenities[], heroImage, gallery[], highlights[]

### Room Data (`src/lib/content.ts`)
- 4 complete room entries with exact tariff data from property sheet
- `mealPlanLabels` map: EP → "Room Only", CP → "With Breakfast", MAP → "Breakfast + Dinner"
- `roomFAQs` array: 5 booking-related FAQ entries
- `getRoomBySlug()` and `getOtherRooms()` utility functions

### Pages Created

| Route | File | Description |
|-------|------|-------------|
| `/rooms` | `src/app/rooms/page.tsx` + `rooms-listing.tsx` | Listing with 4 large cards, trust strip, contact CTA |
| `/rooms/[slug]` | `src/app/rooms/[slug]/page.tsx` + `room-detail.tsx` | Detail page with gallery, rate card, amenities, FAQ |
| `/booking` | `src/app/booking/page.tsx` + `booking-placeholder.tsx` | Placeholder showing query params (room + plan) |

All 4 detail pages statically generated via `generateStaticParams`:
- `/rooms/deluxe`
- `/rooms/superior`
- `/rooms/premium`
- `/rooms/blues-suite`

### Components Created

**Room-specific** (`src/components/rooms/`):
- `RoomGalleryHero` — main image + 2x2 thumbnail grid, click-to-swap, horizontal scroll on mobile
- `RoomRateCard` — meal plan tabs, single/double rates, sticky on desktop, Check Availability CTA
- `RoomAmenitiesGrid` — 2→4 col icon grid with gold-tinted backgrounds
- `RoomHighlights` — checkmark bullet list with gold accent
- `OtherRoomsStrip` — horizontal scroll of 3 other room cards
- `RoomFAQ` — base-ui accordion with 5 booking questions

**Shared** (`src/components/shared/`):
- `Breadcrumb` — semantic nav with chevron separators
- `PageHero` — charcoal hero strip for non-home pages

### Navigation Updated
- `navLinks` in content.ts already pointed to `/rooms` — confirmed working
- `RoomCategoriesPreview` updated to use new Room shape (`heroImage`, `name`, `rates[0].single`)
- Home page room cards link to `/rooms/<slug>`
- "Check Availability" CTA links to `/booking?room=<slug>&plan=<plan>`

### Real Images Used

Images sourced from `ReferenceImages/optimized/` and organized into `public/images/`:

| Category | Hero | Gallery Total | Notes |
|----------|------|---------------|-------|
| Deluxe | `rooms/deluxe/hero.jpg` | 4 + 1 shared bathroom | OK |
| Superior | `rooms/superior/hero.jpg` | 4 + 1 shared bathroom | OK |
| Premium | `rooms/premium/hero.jpg` | 4 + 1 shared bathroom | OK |
| Blues Suite | `rooms/blues-suite/hero.jpg` | 4 + 1 shared bathroom | OK |
| Shared | `rooms/shared/bathroom-*.jpg` | 3 | Used across categories |

**Image gap note**: All source images are classified as "room-unknown" — there is no visual distinction between room categories in the reference photos. The same hotel rooms appear across categories. Once the property provides category-specific photos, swap the files in `public/images/rooms/<category>/`.

Additional images organized:
- `images/dining/` — 3 restaurant photos
- `images/lobby/` — 2 lobby photos
- `images/reception/` — 1 front desk photo
- `images/exterior/` — 1 night facade photo

---

## Files Created / Modified

### Created (17 files)
```
src/types/index.ts                          (rewritten)
src/lib/content.ts                          (rewritten)
src/components/shared/Breadcrumb.tsx
src/components/shared/PageHero.tsx
src/components/rooms/RoomGalleryHero.tsx
src/components/rooms/RoomRateCard.tsx
src/components/rooms/RoomAmenitiesGrid.tsx
src/components/rooms/RoomHighlights.tsx
src/components/rooms/OtherRoomsStrip.tsx
src/components/rooms/RoomFAQ.tsx
src/app/rooms/page.tsx
src/app/rooms/rooms-listing.tsx
src/app/rooms/[slug]/page.tsx
src/app/rooms/[slug]/room-detail.tsx
src/app/booking/page.tsx
src/app/booking/booking-placeholder.tsx
public/images/rooms/**                      (25 image files)
```

### Modified (1 file)
```
src/components/sections/RoomCategoriesPreview.tsx   (updated to new Room shape)
```

---

## What's Still Placeholder

| Item | Location | Action Needed |
|------|----------|---------------|
| Room photos | `public/images/rooms/` | Replace with category-specific photos from property |
| Cancellation policy | `src/lib/content.ts` roomFAQs[1] | Replace with actual hotel cancellation policy |
| Booking flow | `/booking` page | Currently shows "coming soon" — build in Phase 2B |
| Meal plan details | FAQ answers | Verify exact inclusions with property |
| Extra charges | FAQ answers | Verify GST rate, extra bed charges |

---

## What Phase 2B Needs

### Booking Integration
The `/booking` placeholder currently receives and displays these query params:
- `room` — room slug (e.g., `deluxe`, `blues-suite`)
- `plan` — meal plan code (`EP`, `CP`, `MAP`)

Phase 2B should:
1. Build a booking form at `/booking` that pre-fills from these params
2. Add date picker for check-in / check-out
3. Add guest count selector
4. Connect to booking backend (Firebase or external)
5. The `BookingButton` component already generates the correct URL format

### CTA Hookup Points
- `RoomRateCard.tsx` → "Check Availability" button → `/booking?room=<slug>&plan=<plan>`
- Room detail page bottom CTA → same pattern with `plan=EP` default
- Home page hero → "Check Availability" → generic `/booking`
- Rooms listing → cards link to detail pages (not directly to booking)
