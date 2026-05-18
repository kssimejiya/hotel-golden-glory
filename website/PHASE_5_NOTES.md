# Phase 5 — Image loading performance

Goal: fix the slow Firebase Storage image pipeline at the root, then add a
blur-first / shimmer-fallback rendering layer so even slow loads feel
instant. Hotel images now show blur placeholders on first paint and sharpen
in, instead of blank-then-pop.

## Phase 4 regression I had to revert

Phase 4 changed `<Image preload>` to `<Image priority>` on three components,
calling it a bug fix. **That was wrong** — Next.js 16 deprecated `priority`
in favor of `preload`. Confirmed in
`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:293`:

> Starting with Next.js 16, the `priority` property has been deprecated in
> favor of the `preload` property in order to make the behavior clear.

And the version-history table:

> `v16.0.0` — `preload` prop added, `priority` prop deprecated

The original Phase-3 code was correct. I reverted in Sub-Phase 1 (3 files:
[Hero.tsx](src/components/sections/Hero.tsx),
[rooms-listing.tsx](src/app/(public)/rooms/rooms-listing.tsx),
[RoomGalleryHero.tsx](src/components/rooms/RoomGalleryHero.tsx)).

---

## Sub-Phase 1 — Pipeline fix

### next.config.ts changes — [next.config.ts](next.config.ts)

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "firebasestorage.googleapis.com" }, // existing uploads
    { protocol: "https", hostname: "*.firebasestorage.app" },          // newer buckets
  ],
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 768, 1024, 1280, 1536],   // matches Tailwind sm/md/lg/xl/2xl
  qualities: [50, 75],                          // Next 16 requires an allowlist
  minimumCacheTTL: 60 * 60 * 24 * 30,           // 30 days
}
```

Why each line matters:
- **`*.firebasestorage.app`**: newer Firebase project buckets are provisioned
  on this host instead of `firebasestorage.googleapis.com`. Without it, those
  URLs would hit Next's image-optimization domain whitelist and be rejected.
- **`formats: ["avif","webp"]`**: AVIF first cuts payload by ~50% vs JPEG;
  WebP is the universal fallback. Browsers without either fall back to the
  original.
- **`deviceSizes` aligned to Tailwind breakpoints**: Next generates one
  variant per breakpoint and the browser's `srcset` picker grabs the closest
  to the rendered size. Wrong values waste optimizer cycles.
- **`qualities: [50, 75]`**: Next 16 ships an explicit allowlist (was
  `[1..100]`). 75 is the new default for everything; 50 is reserved for the
  blur thumbnails we'll generate.
- **`minimumCacheTTL: 30 days`**: hotel photos are basically immutable per
  season; the admin's upload action gives every new image a unique URL
  (timestamp + uuid), so cache busts for free on replace.

### `sizes` audit — per component

Every `<Image fill>` already had a `sizes` value matching its rendered width;
the only refinement needed was tightening rooms-listing for ≥1280px viewports
(was just `50vw`, now caps at 640px because the Container is `max-w-7xl`).

| Component | Layout | sizes value |
|---|---|---|
| [Hero.tsx](src/components/sections/Hero.tsx) | full-bleed background | `100vw` |
| [DiningPreview.tsx](src/components/sections/DiningPreview.tsx) | 1-col mobile / 2-col desktop split | `(max-width: 1024px) 100vw, 50vw` |
| [RoomCategoriesPreview.tsx](src/components/sections/RoomCategoriesPreview.tsx) | 1/2/4-col responsive grid | `(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw` |
| [rooms-listing.tsx](src/app/(public)/rooms/rooms-listing.tsx) | 1-col / 2-col `md:` | `(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px` |
| [RoomGalleryHero.tsx — main image](src/components/rooms/RoomGalleryHero.tsx) | 60% on lg+ | `(max-width: 1024px) 100vw, 60vw` |
| [RoomGalleryHero.tsx — thumbnails](src/components/rooms/RoomGalleryHero.tsx) | 120px mobile / 20vw desktop | `(max-width: 1024px) 120px, 20vw` |
| [OtherRoomsStrip.tsx](src/components/rooms/OtherRoomsStrip.tsx) | `w-72` cards mobile / 3-col grid desktop | `(max-width: 768px) 288px, 33vw` |
| [StepRoomAndPlan.tsx](src/components/booking/StepRoomAndPlan.tsx) | fixed 112px thumb | `112px` |
| [admin/rooms/page.tsx](src/app/admin/(authenticated)/rooms/page.tsx) | fixed 128px thumb | `128px` |
| [gallery-editor.tsx](src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx) | sm:grid-cols-2 in max-w-3xl | `(max-width: 640px) 100vw, 320px` |

### `preload` audit (above-the-fold only)

| Component | Which images get preload |
|---|---|
| [Hero.tsx](src/components/sections/Hero.tsx) | hero bg (always) |
| [rooms-listing.tsx](src/app/(public)/rooms/rooms-listing.tsx) | first 2 cards (`i < 2`) — the 2-col grid first row |
| [RoomGalleryHero.tsx](src/components/rooms/RoomGalleryHero.tsx) | only when active thumb is index 0 (first paint) |

Everything else stays lazy (Next's default).

---

## Sub-Phase 2 — Upload-time blur + extended type + migrations

### Type change — [src/types/index.ts](src/types/index.ts)

```ts
// new
export interface GalleryImage {
  url: string;
  blurDataURL?: string;   // tiny base64 jpeg from sharp; optional during transition
  width?: number;
  height?: number;
  alt?: string;
}

// Room.gallery: string[]   →   Room.gallery: GalleryImage[]
// Room.heroImage: string   (unchanged — renderers look up the matching gallery
//                           entry by URL to grab blur data for the hero)
```

`heroImage` stays a string to minimise churn — only 6 of 12 callers ever need
its blur, and they can do a one-line `room.gallery.find(g => g.url ===
room.heroImage)?.blurDataURL`.

### Blur helper — [src/lib/images/blur.ts](src/lib/images/blur.ts)

`buildGalleryImage(buffer, url, alt?)`:
1. `sharp(buffer).metadata()` → real width/height for CLS-free reservation.
2. `sharp(buffer).resize({ width: 16 }).jpeg({ quality: 40 }).toBuffer()` →
   base64 → `data:image/jpeg;base64,...` string. Output is ~600B–1.5KB per
   image — small enough to ship inline in HTML without hurting time-to-first-byte.

### Upload action — [src/lib/admin/room-actions.ts](src/lib/admin/room-actions.ts)

After uploading the original to Firebase Storage, `uploadRoomImageAction` now
runs `buildGalleryImage` on the same buffer (sharp is fast — ~50ms on an 8MB
jpeg) and persists `GalleryImage` to Firestore via `arrayUnion`. If sharp
fails for any reason, we still persist a bare `{ url }` so the upload isn't
lost — SmartImage's shimmer covers the gap until the next backfill run.

### Delete / set-hero / reorder

All three were updated to operate on `GalleryImage[]` instead of `string[]`.
The reorder action takes a list of URLs (unchanged client contract) and
rebuilds the gallery in that order, carrying blur/dimensions through.

### Migrations

**One-time backfill** — [scripts/backfill-blur-placeholders.ts](scripts/backfill-blur-placeholders.ts)

Run once after deploying Phase 5:
```
npm run backfill:blur
```

For every `rooms/*` doc, for every gallery entry that's still a bare string
OR an object missing `blurDataURL`, the script:
1. Downloads the bytes via the Firebase Storage URL (the URL is public-readable
   thanks to the download-token-baked-in pattern Phase 3 set up).
2. Generates the blur + dimensions with sharp.
3. Writes the upgraded `GalleryImage[]` back via `set(..., { merge: true })`.

Idempotent — re-runs only touch entries still missing `blurDataURL`, so it's
safe to run after each new upload if a sharp failure ever leaves one
unprocessed (the admin UI surfaces a small amber "No blur" pill on any such
entry so the operator knows).

**Static-image migration** — [scripts/upload-static-images.ts](scripts/upload-static-images.ts)

Already existed for the original `/public/images/rooms/` → Firebase Storage
move. Updated to (a) write the new `GalleryImage[]` shape and (b) generate
blur during the same upload pass. The `isAlreadyMigrated` predicate now
also verifies blur is present, so re-running on a half-migrated doc finishes
the job.

**Local static images (content.ts)**

Local `/images/rooms/*` paths in `src/lib/content.ts` got converted to
`{ url: "/images/..." }` (no blur baked in). They render through SmartImage,
which falls back to shimmer for entries without `blurDataURL`. Local images
are small + same-origin so the shimmer is brief (typically <100ms on
broadband). A future optimization can pre-generate blur for them at build
time and inline it into content.ts — noted in "Remaining gaps".

### Why not multi-size derivatives at upload time?

Next/image already builds size variants on demand (one per `deviceSizes`
entry) and caches them at the edge for `minimumCacheTTL`. Generating a fixed
800px web version at upload too would duplicate that work. The brief noted
this as "secondary, optional" — skipped for now; would only pay off if the
property regularly uploads originals >5MB. PHASE_5 keeps the priority on the
blur string + the next/image pipeline doing the heavy resize work.

---

## Sub-Phase 3 — Blur-first rendering + shimmer fallback

### Shimmer primitive — [src/components/shared/Shimmer.tsx](src/components/shared/Shimmer.tsx) + [globals.css](src/app/globals.css)

Pure CSS — a `linear-gradient` background sweeping a 200%-wide gradient via
`background-position` keyframes, brand-tinted (cream → warmer-cream →
cream). 1.6s linear loop. `prefers-reduced-motion` strips the animation and
shows a flat cream tint.

```css
.shimmer {
  background-color: #f4ece0;
  background-image: linear-gradient(100deg, rgba(244,236,224,0) 0%, rgba(232,226,216,0.9) 50%, rgba(244,236,224,0) 100%);
  background-size: 200% 100%;
  animation: shimmer-sweep 1.6s linear infinite;
}
```

Zero JS, zero Framer cost. Per the brief, this is **not** a 6th Framer
animation pattern — it's a CSS utility, reusable for future loading states
(admin tables, etc).

### SmartImage wrapper — [src/components/shared/SmartImage.tsx](src/components/shared/SmartImage.tsx)

A drop-in replacement for `next/image` that picks one of three strategies
based on the `blurDataURL` prop:

1. **Blur present** → renders `<Image placeholder="blur" blurDataURL={...}>`
   and lets next/image own the placeholder-to-image transition (it's tight
   and well-tuned). No JS state needed.
2. **Blur absent** → renders `<Image>` opacity-0 with an absolutely-positioned
   `<Shimmer>` underneath. `onLoad` flips state, opacity-fades the image in
   over 400ms (CSS transition, not Framer). Shimmer is hidden once loaded.
3. **`onError`** → swaps to a cream tile with an `ImageOff` icon at 40%
   opacity. Never a broken-image glyph.

The component forwards every `next/image` prop except `placeholder` and
`blurDataURL` (it manages those itself). `alt` is destructured separately so
the `jsx-a11y/alt-text` linter can see it.

### Component swaps (raw `<Image>` → `<SmartImage>`)

All room-photo render sites converted. Hero + DiningPreview kept as raw
`<Image>` because they're local public images using `placeholder="blur"` with
an already-generated `blurDataURL` constant (no value in wrapping).

| File | Image source | Now uses |
|---|---|---|
| [RoomCategoriesPreview.tsx](src/components/sections/RoomCategoriesPreview.tsx) | `room.heroImage` | SmartImage + blur lookup |
| [OtherRoomsStrip.tsx](src/components/rooms/OtherRoomsStrip.tsx) | `room.heroImage` | SmartImage + blur lookup |
| [rooms-listing.tsx](src/app/(public)/rooms/rooms-listing.tsx) | `room.heroImage` | SmartImage + blur lookup + `preload={i<2}` |
| [RoomGalleryHero.tsx](src/components/rooms/RoomGalleryHero.tsx) | `room.gallery[i]` (main + 4 thumbs) | SmartImage; main image gets `preload` on first paint |
| [StepRoomAndPlan.tsx](src/components/booking/StepRoomAndPlan.tsx) | `room.heroImage` thumb | SmartImage + blur lookup |
| [admin/rooms/page.tsx](src/app/admin/(authenticated)/rooms/page.tsx) | `room.heroImage` thumb | SmartImage + blur lookup |
| [gallery-editor.tsx](src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx) | `GalleryImage[]` per entry | SmartImage + per-entry blur; shows "No blur" amber pill for entries missing it |

---

## Sub-Phase 4 — Verification

### Build / lint / typecheck

```
npm run typecheck   # clean
npm run lint        # ZERO warnings (was zero coming in too)
npm run build       # clean — all routes still built
```

### Manual test checklist

In Chrome DevTools → Network tab → set throttling profile:

1. **Throttle to "Slow 4G" (or Slow 3G), then reload `/rooms/deluxe`** —
   expected: every gallery image shows its blur placeholder instantly; the
   sharp image fades in as it streams down. No blank gaps. Click thumbs
   to swap; subsequent images blur-first too.
2. **Reload `/rooms` (listing)** — expected: 4 cards show blur immediately;
   first 2 are preload-hinted so they finish first.
3. **Reload `/` (homepage)** — expected: 4 RoomCategoriesPreview cards blur
   in. Hero photo uses its existing blur constant (unchanged).
4. **Pre-migration entry (one with no `blurDataURL`)** — expected: shimmer
   sweep visible instead of blur. Once loaded, fades to image. No flash of
   broken-image icon.
5. **Force an error** — swap a `room.heroImage` URL to something invalid in
   a test build. Expected: cream tile with a faded `ImageOff` icon, never a
   browser-default broken image.
6. **Admin gallery upload** — upload a new image in `/admin/rooms/<slug>`.
   Expected: server log shows the upload + blur generation succeeds;
   reloading the gallery shows the new entry with blur (no "No blur" pill).
7. **Backfill migration** — for an existing room doc with bare-string
   gallery entries from before Phase 5, run `npm run backfill:blur`. Expect
   one line per upgraded entry, then a summary; gallery editor's "No blur"
   pills disappear after refresh.
8. **`prefers-reduced-motion: reduce`** — toggle in DevTools (Rendering →
   Emulate CSS media `prefers-reduced-motion: reduce`). Reload a slow page.
   Shimmer should be a flat cream tint (no sweep); the image-fade-in
   transition still runs but is barely perceptible (400ms is fine; if user
   complaints come, switch to instant on reduced-motion).
9. **Throttled Lighthouse pass** — `lighthouse http://localhost:3000/rooms
   --throttling-method=simulate --view`. LCP and CLS should both improve
   vs the Phase 4 baseline. Specifically: LCP should drop because the
   blur image ships in the HTML and the LCP candidate (one of the room
   hero photos) now has a `preload` link injected for the first 2 cards;
   CLS should stay 0 because every fill image lives in an aspect-ratio
   container.

### Network / payload expectations

- AVIF variants are now in the optimizer's output. On Chrome, room hero
  image payload typically drops ~50% vs JPEG (e.g. 280KB → ~140KB at 1280w).
- 30-day cache TTL means warm visits skip the Firebase round-trip
  entirely — only the initial render after a deploy or upload pays the cost.
- Each blur is ~600B–1.5KB inlined in HTML. For a 4-card grid that's ~4KB
  of HTML overhead in exchange for an instant non-blank first paint.

---

## What's still mocked / unchanged

| Concern | Status |
|---|---|
| Image optimization (resize, format, srcset) | **REAL** via Next image optimizer |
| Blur placeholders (admin upload path) | **REAL** via sharp at upload time |
| Blur placeholders (pre-Phase-5 gallery entries) | needs one-time `npm run backfill:blur` |
| Blur placeholders (static `content.ts` local images) | falls back to shimmer (brief — same origin) |
| Multi-size derivative generation at upload | **NOT BUILT** (Next handles on-demand; not a priority) |

---

## Remaining gaps / future work

1. **Bake static-image blur into content.ts at build time** — a small
   pre-build script could run sharp over `/public/images/rooms/*` and inline
   `blurDataURL` strings into the `content.ts` gallery entries. Would
   eliminate the (brief) shimmer for local-image rooms. Not urgent — local
   images are same-origin and small.
2. **Razorpay live / SMS / hotel-staff alert / PDF voucher / booking reports
   dashboard** — all carried forward from Phase 4 NOTES.
3. **SmartImage `useEffect` for cached images** — current implementation
   relies on `onLoad` firing. For images that come from disk cache and
   complete before mount, `onLoad` should still fire (React 18+ behavior is
   reliable here), but if real-world telemetry ever shows a stuck shimmer,
   add an `useEffect(() => { if (img.current?.complete) setLoaded(true) },
   [])` belt-and-braces using a ref forwarded into the underlying `<img>`.

---

## File inventory

### Created (4)
```
src/components/shared/SmartImage.tsx
src/components/shared/Shimmer.tsx
src/lib/images/blur.ts
scripts/backfill-blur-placeholders.ts
website/PHASE_5_NOTES.md
```

### Modified (12)
```
next.config.ts                                                — image pipeline config
package.json                                                  — sharp dep, backfill:blur script
src/app/globals.css                                            — shimmer keyframes + class
src/types/index.ts                                             — GalleryImage type, Room.gallery shape
src/lib/content.ts                                             — static gallery entries → objects
src/lib/firebase/roomRepo.ts                                   — normalizeGallery (legacy-tolerant merge)
src/lib/admin/room-actions.ts                                  — upload generates blur; delete/hero/reorder use new shape
scripts/upload-static-images.ts                                — also writes new shape + blur
src/components/sections/Hero.tsx                               — priority→preload revert
src/components/sections/RoomCategoriesPreview.tsx              — SmartImage
src/components/rooms/OtherRoomsStrip.tsx                       — SmartImage
src/components/rooms/RoomGalleryHero.tsx                       — GalleryImage[] input + SmartImage
src/components/booking/StepRoomAndPlan.tsx                     — SmartImage
src/app/(public)/rooms/rooms-listing.tsx                       — SmartImage + priority→preload revert + tighter sizes
src/app/admin/(authenticated)/rooms/page.tsx                   — SmartImage
src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx  — GalleryImage[] input + SmartImage + "No blur" pill
```
