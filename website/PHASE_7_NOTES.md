# Phase 7 — Premium image delivery pipeline + premium gallery motion

Two sub-phases, hard gate between them. Both gates passed.

---

## SUB-PHASE 1 — Multi-size AVIF+WebP CDN-direct pipeline

### Goal
Every gallery image is served as the exact size needed for its slot, in
AVIF (WebP fallback), straight from the Firebase Storage CDN — no
`/_next/image` round-trip. Untouched originals are always preserved.

### Data shape — [src/types/index.ts](src/types/index.ts)
```ts
export interface ImageVariant { url: string; width: number; height: number; }
export interface GalleryImage {
  original?: string;          // Phase-7: archived original
  url?: string;               // Pre-Phase-7: single legacy URL
  blurDataURL?: string;       // ~1-2KB base64 jpeg
  width?: number;             // intrinsic width of the largest variant
  height?: number;
  alt?: string;
  variants?: {
    avif: ImageVariant[];     // ascending by width
    webp: ImageVariant[];
  };
}
```
`Room.heroImage` stays a string key; `imageKey(g) = g.original ?? g.url ??
""` is the identity helper. `heroImage` for new entries points at
`original`; legacy entries continue to point at `url` until migrated.

### Three on-disk shapes, all tolerated
[`normalizeGallery`](src/lib/firebase/roomRepo.ts) accepts:
1. Bare `string[]`            (pre-Phase-5)
2. `{url, blurDataURL, ...}`  (Phase-5)
3. `{original, variants, ...}` (Phase-7)

Half-built `variants` (one format invalid) drop back to the legacy render
path — production never breaks mid-migration.

### Storage layout
```
rooms/{slug}/{imageId}/original.{ext}     ← archived, never served
rooms/{slug}/{imageId}/2400.avif
rooms/{slug}/{imageId}/2400.webp
rooms/{slug}/{imageId}/1600.avif
… etc, descending to the original's longest edge
```
Files uploaded with `Cache-Control: public, max-age=31536000, immutable`.
Each upload is content-addressed by `{imageId}` so any edit gets a new URL —
no manual cache busts needed.

### Encoding (do not deviate without bumping a phase)
- `sharp` quality **90** for both AVIF and WebP — visually lossless tier.
- `fit: "inside", withoutEnlargement: true` — never upscale a small original.
- Targets `[2400, 1600, 1024, 640]` longest-edge, filtered to non-upscaling
  sizes. If every target exceeds the original, emit one variant at the
  original's longest edge (still re-encoded at q90).
- `.withMetadata({})` strips EXIF on web variants (smaller + privacy). The
  archived original keeps its metadata.

### Processing module — [src/lib/images/process.ts](src/lib/images/process.ts)
`processGalleryImage(buffer, slug, options) → { image, attempted, succeeded, failed }`
- Per-variant try/catch — one failed AVIF doesn't sink the WebP variants or
  the rest of the sizes. As long as ≥1 webp variant succeeded, SmartImage
  takes the `<picture>` path. Otherwise legacy.
- Blur (20px wide, jpeg q40) generated in its own try/catch.
- Throws only on total sharp parse failure — callers (upload action, scripts)
  fall back to a legacy `{url}` entry pointing at a single raw upload so no
  upload is ever lost.

### Upload action — [src/lib/admin/room-actions.ts](src/lib/admin/room-actions.ts)
- Cap raised **8 MB → 15 MB** to feed the 2400px AVIF/WebP variant.
- Runs `processGalleryImage`; total sharp failure falls back to a single raw
  upload at `rooms/{slug}/{imageId}/original.{ext}` recorded as `{url: …}`.
- `deleteRoomImageAction` calls `bucket.deleteFiles({ prefix:
  rooms/{slug}/{imageId}/ })` to wipe original + every variant atomically.
  Legacy `{url}` entries get the targeted single-file delete.
- `setHeroImageAction`, `reorderGalleryAction` switched from `g.url` to
  `imageKey(g)` so they work on both shapes.

### Rendering — [src/components/shared/SmartImage.tsx](src/components/shared/SmartImage.tsx)
- New `image: GalleryImage` prop. Path selection:
  - **Phase-7** (`variants.webp.length > 0`): native `<picture>` with
    `<source type="image/avif" srcset>` + `<source type="image/webp" srcset>`
    + fallback `<img>`. Bypasses `/_next/image` entirely; served straight
    from the Firebase CDN.
  - **Legacy** (`url` only): next/image path, blur if present else shimmer.
  - **Local** (Hero, DiningPreview): same legacy path with `src` prop
    instead of `image`.
- Preserves every existing UX overlay:
  - blur underlay (CSS background-image so it can stack under the
    `<picture>`)
  - shimmer fallback when no blur
  - opacity 0 → 1 fade-in (500ms) on load
  - ref-callback `img.complete && naturalWidth > 0` cached-image rescue
  - cream + ImageOff fallback tile on error
- `preload` / `loading="eager"` propagate to `fetchpriority="high"` for LCP
  images (gallery main image with `activeIndex === 0`, first 2 room cards).

### Migration — `npm run migrate:variants`
[`scripts/migrate-gallery-variants.ts`](scripts/migrate-gallery-variants.ts) —
idempotent. Per room doc, per entry: skip if already has variants; otherwise
download bytes from current URL, re-run sharp pipeline, upload new variants
+ a fresh archived original under the canonical Phase-7 path, rewrite
Firestore. The hero pointer is rewritten too when its old URL maps to a new
`original`. Old Storage paths are left intact as a safety net — clean up
manually after confirming new variants render.

`scripts/upload-static-images.ts` (`npm run upload:images`) updated to
produce the new shape directly for fresh installs.

### File inventory (sub-phase 1)
| Status | File |
|---|---|
| **Created** | `src/lib/images/process.ts`, `src/lib/images/gallery.ts`, `scripts/migrate-gallery-variants.ts` |
| **Modified** | `src/types/index.ts`, `src/lib/firebase/roomRepo.ts`, `src/lib/admin/room-actions.ts`, `src/components/shared/SmartImage.tsx`, `src/components/sections/RoomCategoriesPreview.tsx`, `src/components/rooms/OtherRoomsStrip.tsx`, `src/components/rooms/RoomGalleryHero.tsx`, `src/components/booking/StepRoomAndPlan.tsx`, `src/app/(public)/rooms/rooms-listing.tsx`, `src/app/admin/(authenticated)/rooms/page.tsx`, `src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx`, `scripts/upload-static-images.ts`, `package.json` |
| **Deleted** | `src/lib/images/blur.ts` (superseded by `process.ts`), `scripts/backfill-blur-placeholders.ts` (superseded by `migrate-gallery-variants.ts`) |

### Sub-Phase 1 manual tests (developer must run)
1. `npm run migrate:variants` → confirm Firestore galleries gain
   `variants`; Storage shows `rooms/{slug}/{imageId}/{2400|1600|1024|640}.{avif|webp}`
   plus `original.{ext}`. Old paths still present.
2. DevTools → Network → reload `/rooms/<slug>` → image requests go **directly
   to `firebasestorage.googleapis.com`** (NOT `/_next/image`), Content-Type
   `image/avif` on Chrome, `image/webp` on Safari ≤16.
3. Throttle Slow 4G → correctly-sized variant per viewport (a 1280-wide
   viewport pulls 1600, a phone pulls 640 or 1024).
4. Retina/2x screen → image is sharp not soft (browser picks higher-density
   variant from srcset).
5. Cached reload → images appear immediately, no opacity-0 hang
   (SmartImage's ref callback handles the cached `<picture>` case).
6. Admin: upload an image in `/admin/rooms/<slug>` → Firestore entry has
   `variants` populated; Storage folder has all sizes. Then delete it →
   whole `rooms/{slug}/{imageId}/` folder is gone.
7. Gallery editor shows an amber "Legacy" pill on any entry still missing
   variants (was previously the "No blur" pill — the meaning shifted
   because everything now should have variants).

---

## SUB-PHASE 2 — Premium gallery motion

### Goal
RoomGalleryHero should feel like an iOS detail view — restrained,
intentional, never gaudy. Every animation has a reduced-motion fallback.

### What's animated

| Element | Motion | Implementation | Reduced-motion |
|---|---|---|---|
| **Main image** | Ken Burns: `scale(1) → scale(1.045)` over 12s, ease-in-out, alternate-loop | CSS class `.gallery-ken-burns` in globals.css. Restarts per selection via `key={...}` on the wrapper. GPU `transform` only — zero layout cost. | `animation: none` |
| **Main image swap** | Cross-fade ~400ms ease-out. Outgoing image stays painted underneath until incoming finishes fading in. Combined with the blur underlay, zero blank-frame risk even on slow networks. | Layered: `prev` + `current` `<div>`s stacked in the same wrapper; `.gallery-fade-in` keyframe runs on `current`; `prev` is unmounted via a 420ms `setTimeout` after the fade completes. Click-during-fade cancels the timer and re-schedules. | `animation: none` — instant swap |
| **Main panel tap echo** | `scale(1) → 0.99 → 1` over 150ms on each thumb click | CSS class `.gallery-tap-echo` re-triggered by bumping a `tapToken` state and using it as the wrapper's `key` so React remounts and the animation re-fires (even when clicking the same thumb) | `animation: none` |
| **Thumbnail hover (desktop)** | Lift `y: -6` + gold-tinted shadow, snappy iOS spring | Existing `cardLift` + `cardLiftTransition` from [animations.ts](src/lib/animations.ts) on `motion.button` — NOT a new Framer pattern | `whileHover={undefined}` |
| **Thumbnail tap** | `scale: 0.96` | Existing `tapFeedback` from animations.ts | `whileTap={undefined}` |
| **Active thumbnail ring** | 2px gold ring + 2px cream offset + 4px gold/15 outer glow | Tailwind utilities only — `ring-2 ring-gold ring-offset-2 ring-offset-cream shadow-[0_0_0_4px_rgba(216,147,57,0.15)]` | No motion |
| **Main panel vignette** | Subtle inner shadow `boxShadow: inset 0 0 60px rgba(31,31,31,0.08)` on lg+ only | Static CSS, no animation | unaffected |
| **Image fade-in (de-blur)** | 500ms opacity transition (SmartImage's existing `transition-opacity duration-500`) covers the blur → sharp swap | Tailwind utility on the `<img>` element. CSS transitions are not gated by `prefers-reduced-motion` — 500ms is below typical disruption thresholds. If a user complains we can add a media-query override. | n/a |

### No new Framer pattern
- Ken Burns, cross-fade, tap echo: all **CSS keyframes** in globals.css.
  Reduced-motion suppression is one media-query block at the bottom of
  globals.css covering all three.
- Thumbnails use the existing `cardLift` + `cardLiftTransition` +
  `tapFeedback` from animations.ts. Same as room cards everywhere else.

### Mobile behaviour
- Horizontal scroll strip preserved (the existing `flex gap-3 overflow-x-auto
  lg:grid …` layout is unchanged). Mobile thumbnails still react to
  hover/tap. Ken Burns and cross-fade are CSS — they run on mobile too at
  no measurable cost.

### File changes (sub-phase 2)
| Status | File |
|---|---|
| **Modified** | `src/app/globals.css` (added 3 keyframes + 3 utility classes + reduced-motion fallbacks), `src/components/rooms/RoomGalleryHero.tsx` (cross-fade layering + Ken Burns + tap echo + framer hover/tap on thumbs + vignette) |

### Sub-Phase 2 manual tests
1. Open `/rooms/deluxe` on desktop. Wait ~5s. Confirm the main image is
   very gently zooming — visible if you stare, NOT distracting.
2. Click each thumbnail. Confirm:
   - The main image cross-fades smoothly — no blank frame, no hard cut.
   - The main panel briefly dips with the tap echo.
   - Ken Burns restarts from `scale(1)` for the new image.
3. Hover the four thumbnails (desktop). Confirm the lift + gold shadow on
   each. Tap any thumb — scale dip + cross-fade.
4. Resize to 390px mobile width. Confirm:
   - Thumbs are a horizontal scroll strip with equal gaps.
   - Tap-to-swap still cross-fades; tap echo still fires.
5. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Reload.
   Confirm: Ken Burns gone, swap is instant (no fade), tap echo gone,
   thumbnail hover/tap silent. Image still appears.
6. With network throttling at Slow 3G, click a thumb whose new image isn't
   cached. Confirm: blur placeholder appears under the cross-fade, then
   sharp image fades in. No blank frame.

---

## Final gate (both sub-phases)
```
npm run typecheck   # tsc --noEmit            — clean
npm run lint        # eslint                  — ZERO warnings
npm run build       # next build --webpack    — clean
```

## What's still mocked / unchanged from earlier phases
| Concern | Status | Where to swap |
|---|---|---|
| Multi-size AVIF/WebP delivery (gallery images) | **REAL** — Phase 7 | — |
| Cached-image rescue, blur, shimmer, error tile | **REAL** — preserved | — |
| Razorpay payment | MOCK | per Phase 4 NOTES |
| SMS / hotel-staff alert | MOCK | per Phase 4 NOTES |
| Booking PDF voucher | not built | per Phase 4 NOTES |
| Multi-size optimization for Hero + DiningPreview (local images) | not done — they still use next/image with bundled blur | low priority — they're small + same-origin |

## Known remaining gaps
1. **Hero + DiningPreview** still go through `next/image` with bundled blur
   constants. Acceptable: they're local public images, small, same-origin.
   Could be swapped to a build-time multi-size pipeline later if needed.
2. **`width` and `height` of legacy `{url}` entries** may be unknown (not
   in the stored doc) — the `<img>` then renders without explicit
   dimensions. Mitigated by the `aspect-[4/3]` container so CLS is still 0.
3. **Old Storage paths** from the pre-Phase-7 layout are not auto-cleaned
   by the migration script. Manual cleanup via Firebase Console
   recommended after confirming the new variants render. Listed as a
   trailing step in the migration script's output.
