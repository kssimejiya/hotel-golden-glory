# Image Pipeline Self-Audit

A from-scratch audit of every image render path. Found 5 real bugs; fixed
all 5. Static verification only — runtime behaviour items are listed in
"MUST TEST MANUALLY" at the bottom.

## Bugs found + fixes applied

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | [SmartImage.tsx](src/components/shared/SmartImage.tsx) | **Cached-image SSR bug**. A cached `<img>` completes loading BEFORE React hydrates and attaches the `onLoad` handler → `onLoad` never fires for React to catch → image stuck at `opacity-0` forever. Classic facebook/react#15446. | Replaced `useEffect`-only loaded tracking with a **ref callback** that runs synchronously at React's attach time and inspects `img.complete && img.naturalWidth > 0`. If complete-and-loaded → `setLoaded(true)`. If complete-but-broken (naturalWidth === 0) → `setErrored(true)`. Catches both cached-success and cached-error cases that `onLoad`/`onError` would miss. |
| 2 | [SmartImage.tsx](src/components/shared/SmartImage.tsx) | `transition-opacity duration-400` — **`duration-400` is not in Tailwind's default duration scale** (which is `{0,75,100,150,200,300,500,700,1000}`). The class was silently dropped, so the fade ran at Tailwind's `transition-duration` default (150ms), not the intended 400ms. | Changed to `duration-500` (real default class) so the fade actually runs at 500ms. |
| 3 | [SmartImage.tsx](src/components/shared/SmartImage.tsx) | **Stuck error state on src change**: in `RoomGalleryHero`, clicking a thumbnail mutates the `src` prop; a previously errored thumb's `errored=true` would persist and the user would see the fallback tile permanently even after a working new src. Same issue for `loaded` (stale "loaded" state from previous image). | Added the React-recommended **in-render prop comparison** pattern: a `trackedSrc` state held alongside `loaded`/`errored`; when `src !== trackedSrc` during render, reset all three. Triggers an immediate re-render before commit — no flash, no double-paint. |
| 4 | [src/app/layout.tsx](src/app/layout.tsx) | **No `metadataBase`**: OG/Twitter/Facebook image URLs on room-detail pages are relative paths like `/images/rooms/deluxe/hero.jpg` (for static-content rooms). Social-card scrapers cannot resolve relative URLs → broken share previews. | Added `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")`. Next.js now auto-resolves every relative OG image to an absolute URL. |
| 5 | [DiningPreview.tsx](src/components/sections/DiningPreview.tsx) | Raw `<Image>` with **no placeholder strategy** — image popped in blank-then-pop on first render. The brief said Hero/DiningPreview can stay as raw next/image only if they bundle a `blurDataURL` constant. | Added `placeholder="blur"` + a 1×1 warm-cream `DINING_BLUR_DATA_URL` constant tuned to the restaurant photo's tone. Removed the stray `decoding="async"` (next/image sets this itself). |

---

## Step 1 — Master inventory

| File:line | Component | Image source | fill / fixed | sizes | preload | placeholder | SmartImage? | Notes |
|---|---|---|---|---|---|---|---|---|
| [Hero.tsx:70](src/components/sections/Hero.tsx#L70) | Hero | local `/images/exterior/building-night.jpg` | fill | `100vw` | yes | blur (bundled constant) | N — local image with bundled blur, no need to wrap | BLUR_DATA_URL is a valid 1×1 charcoal PNG (verified) |
| [DiningPreview.tsx:54](src/components/sections/DiningPreview.tsx#L54) | DiningPreview | local `/images/dining/restaurant-main.jpg` | fill | `(max-width: 1024px) 100vw, 50vw` | no (default lazy) | blur (bundled constant, **added in this audit**) | N — same as Hero | DINING_BLUR_DATA_URL is a valid 1×1 cream-tinted PNG (verified) |
| [RoomCategoriesPreview.tsx:49](src/components/sections/RoomCategoriesPreview.tsx#L49) | RoomCategoriesPreview | `room.heroImage` (FB Storage or local) | fill | `(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw` | no | blur if found in gallery, else shimmer | Y | hero blur via `gallery.find(g => g.url === heroImage)?.blurDataURL` |
| [rooms-listing.tsx:54](src/app/(public)/rooms/rooms-listing.tsx#L54) | RoomsListing | `room.heroImage` | fill | `(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px` | first 2 (`i<2`) | blur if found, else shimmer | Y | |
| [RoomGalleryHero.tsx:23](src/components/rooms/RoomGalleryHero.tsx#L23) | RoomGalleryHero main | `images[activeIndex].url` | fill | `(max-width: 1024px) 100vw, 60vw` | only when `activeIndex===0` | per-entry `active.blurDataURL` | Y | |
| [RoomGalleryHero.tsx:49](src/components/rooms/RoomGalleryHero.tsx#L49) | RoomGalleryHero thumbs (4) | `images[i].url` | fill | `(max-width: 1024px) 120px, 20vw` | no | per-entry `img.blurDataURL` | Y | |
| [OtherRoomsStrip.tsx:47](src/components/rooms/OtherRoomsStrip.tsx#L47) | OtherRoomsStrip | `room.heroImage` | fill | `(max-width: 768px) 288px, 33vw` | no | blur if found, else shimmer | Y | |
| [StepRoomAndPlan.tsx:160](src/components/booking/StepRoomAndPlan.tsx#L160) | StepRoomAndPlan thumb | `room.heroImage` | fill | `112px` | no | blur if found, else shimmer | Y | |
| [admin/rooms/page.tsx:27](src/app/admin/(authenticated)/rooms/page.tsx#L27) | AdminRooms list | `room.heroImage` | fill | `128px` | no | blur if found, else shimmer | Y | |
| [gallery-editor.tsx:137](src/app/admin/(authenticated)/rooms/[slug]/gallery-editor.tsx#L137) | GalleryEditor | per-entry `entry.url` | fill | `(max-width: 640px) 100vw, 320px` | no | per-entry blur, else shimmer | Y | shows amber "No blur" pill on entries missing blur — operator signal to run backfill |
| [SmartImage.tsx:77](src/components/shared/SmartImage.tsx) | SmartImage (internal) | forwarded | — | forwarded | forwarded | managed | (wrapper itself) | ref callback handles cached-image case |

Raw `<img>` tags: **0** ✓
CSS `background-image` references: **1** ([Hero.tsx:89](src/components/sections/Hero.tsx#L89)) — a `linear-gradient(...)` scrim overlay (no raster image). ✓
Email-template images: **0** — [BookingConfirmation.tsx](src/emails/BookingConfirmation.tsx) is text-only with inline-styled brand colors. (If an image is added later, it MUST be an absolute https URL based on `NEXT_PUBLIC_SITE_URL`; email clients can't resolve relative paths or call `/_next/image`.)
JSON-LD images: **0** in hotelJsonLd / contact ld+json. SEO opportunity but not a bug.
OG/metadata images: **1 dynamic** at [rooms/[slug]/page.tsx:29](src/app/(public)/rooms/[slug]/page.tsx#L29) — `room.heroImage`. **Now resolves to absolute** via the new `metadataBase` (bug-fix #4).

---

## Step 2 — next.config.ts verification

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },     // legacy, unused but harmless
    { protocol: "https", hostname: "firebasestorage.googleapis.com" },  // every actual upload URL
    { protocol: "https", hostname: "*.firebasestorage.app" },    // defensive — newer buckets
  ],
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 768, 1024, 1280, 1536],
  qualities: [50, 75],
  minimumCacheTTL: 60 * 60 * 24 * 30,   // 30 days
}
```

| Check | Result |
|---|---|
| Bucket → remotePattern coverage | The actual upload URL format from [room-actions.ts:139](src/lib/admin/room-actions.ts#L139) is `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/...`. **The bucket name is in the URL PATH, not the hostname.** Hostname is always `firebasestorage.googleapis.com` regardless of bucket. So pattern #2 covers 100% of generated URLs. Pattern #3 (`*.firebasestorage.app`) is defensive for any future direct-bucket access (newer Firebase project buckets can serve files from `<bucket>.firebasestorage.app` too). |
| AVIF + WebP | Present, AVIF first. |
| `qualities: [50, 75]` membership check | `grep "quality" src/` → zero `quality` props on any `<Image>` or `<SmartImage>` in JSX. Default is 75 (in the allowlist). Only other `.quality` occurrence is `sharp({...}).jpeg({ quality: 40 })` in [blur.ts:27](src/lib/images/blur.ts#L27) — sharp's internal API, unrelated. ✓ |
| `deviceSizes` coverage | Container caps at `max-w-7xl` (1280px); 1536 is overshoot but harmless. All Tailwind breakpoints represented. |
| `imageSizes` (default) | `[16,32,48,64,96,128,256,384]`. Our fixed-size renders (112, 120, 128, 288, 320) bucket cleanly to 128/128/128/384/384. ✓ |
| `minimumCacheTTL` | 30 days. ✓ |
| `unoptimized` anywhere | `grep -rn "unoptimized" src/` → 0 hits. ✓ |

---

## Step 3 — Per-component `sizes` math

Container width: `max-w-7xl` (1280px) with `px-4 sm:px-6 lg:px-8` padding.
At ≥1280 viewport: content width is ~1216px (1280 - 64).
At 1024–1279: content ≈ viewport - 64.
At 640–1023: content ≈ viewport - 48.
At <640: content ≈ viewport - 32.

| Component | Layout / container math | Real rendered width by breakpoint | Current sizes | Match? |
|---|---|---|---|---|
| Hero | full-bleed `min-h-screen`, no Container | 100vw always | `100vw` | ✓ |
| DiningPreview | Container > `grid lg:grid-cols-2`, image is one column on lg+ | <1024: ~100vw; ≥1024: half of (viewport-padding) ≈ 50vw | `(max-width: 1024px) 100vw, 50vw` | ✓ |
| RoomCategoriesPreview | Container > `grid sm:grid-cols-2 xl:grid-cols-4` (gap-6) | <640: ~100vw; 640–1279: ~50vw; ≥1280: ~25vw (cap 304px) | `(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw` | ✓ |
| rooms-listing | Container > `grid md:grid-cols-2` (gap-8) | <768: ~100vw; 768–1279: ~50vw; ≥1280: ~600px (capped by container) | `(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px` | ✓ (640 maps to a deviceSize) |
| RoomGalleryHero main | Container > `grid lg:grid-cols-[3fr_2fr]` (gap-3) — image is 3/5 column | <1024: 100vw; 1024: ~580px; 1280: ~720px | `(max-width: 1024px) 100vw, 60vw` | ✓ (60vw at 1280 = 768, slight overshoot but next deviceSize) |
| RoomGalleryHero thumbs | mobile: `w-28` (112px) / `sm:w-36` (144px); lg+: 2×2 grid inside 40% column | mobile 112-144; lg+ ~190-237 | `(max-width: 1024px) 120px, 20vw` | ✓ |
| OtherRoomsStrip | mobile: `w-72` (288px); md+ `md:grid md:grid-cols-3` | mobile: 288; md+: ~227-392 | `(max-width: 768px) 288px, 33vw` | ✓ |
| StepRoomAndPlan thumb | fixed `h-20 w-28` | always 112 | `112px` | ✓ exact |
| admin/rooms list | fixed `h-32 w-32` | always 128 | `128px` | ✓ exact |
| GalleryEditor thumb | admin container `max-w-3xl` (768px), sm:grid-cols-2 | <640: ~100vw; sm+: ~352-374 | `(max-width: 640px) 100vw, 320px` | ✓ (320 maps to 384 deviceSize) |

**No mismatches found.** No oversized downloads, no under-sized blurry images.

---

## Step 4 — SmartImage branch proof

Per-branch trace of the rewritten [SmartImage.tsx](src/components/shared/SmartImage.tsx):

### Branch A — blurDataURL present
- `hasBlur = true`
- Shimmer NOT rendered (line 105: `!hasBlur && !loaded` is false)
- `<Image>` rendered with `placeholder="blur"` + `blurDataURL` spread in via line 122
- `className` omits the opacity-fade classes (all gated on `!hasBlur`)
- next/image owns the blur-up transition; we don't interfere

### Branch B — blurDataURL absent, image loads via network
- `hasBlur = false`
- `<Shimmer>` overlay rendered absolute inset-0
- `<Image>` rendered with `transition-opacity duration-500 opacity-0`
- onLoad fires → `setLoaded(true)` → re-render → Shimmer unmounts, image animates to opacity-100 over 500ms

### Branch C — blurDataURL absent, image cached
- Server HTML includes `<Shimmer>` + `<img opacity-0>`
- Client hydrates
- Ref callback (line 87, `handleImgRef`) runs synchronously at attach
- `img.complete === true` (cached!) and `img.naturalWidth > 0` → `setLoaded(true)`
- React re-renders: Shimmer unmounts, image becomes opacity-100
- **onLoad never fires for React — but the ref callback already handled it.** ✓ (bug-fix #1)

### Branch D — image errors (network 403, broken file, expired token)
- onError fires → `setErrored(true)` → next render returns the error tile only (no half-shown image, no half-shown shimmer)
- **OR** for a cached error: ref callback sees `complete && naturalWidth === 0` → `setErrored(true)` synchronously → same result. ✓

### Branch E — src changes (gallery thumb click)
- Render: `src !== trackedSrc` → in-render reset of trackedSrc + loaded + errored to clean state
- React commits the reset render before fetching new image
- Ref callback fires on re-attach with the new src
- Goes through branch A/B/C/D for the new image ✓ (bug-fix #3)

### Branch F — `prefers-reduced-motion: reduce`
- Shimmer's `.shimmer` class still applies, but the [globals.css](src/app/globals.css) media query strips `background-image` and `animation` → user sees a static cream tile (no sweep, no motion)
- Image fade still runs (500ms opacity transition — below most "disruptive motion" thresholds). Acceptable per Phase-3 norms.

### Forwarded props (verified via TypeScript)
- `preload`, `fill`, `sizes`, `width`, `height`, `loading`, `priority` (deprecated), `quality`, `style` all forward via `{...rest}` — `ForwardedImageProps = Omit<ImageProps, "placeholder" | "blurDataURL">`
- `onLoad`, `onError`: user's handlers called AFTER our state update
- `alt`: destructured explicitly so `jsx-a11y/alt-text` linter sees it
- `src`: destructured to drive the trackedSrc compare

### Hydration safety
- `useState` initial values: `loaded=false`, `errored=false`, `trackedSrc=src` — all deterministic.
- Server render === client render at first paint. No mismatch.
- Initial `src === trackedSrc` so the in-render reset is a no-op on first render.
- Ref callback only runs after mount → no SSR concerns.

---

## Step 5 — Migration tolerance proof

### `normalizeGallery` ([roomRepo.ts:41-61](src/lib/firebase/roomRepo.ts#L41))

| Input | Output |
|---|---|
| `null` / `undefined` | `null` (caller falls back to `base.gallery`) |
| `[]` | `null` |
| `["url1", "url2"]` (legacy bare strings) | `[{url:"url1"}, {url:"url2"}]` |
| `[{url:"a"}, {url:"b", blurDataURL:"..."}]` (mixed shapes) | passes through unchanged |
| `["", null, undefined]` | `null` (all entries normalize to null, length 0 check filters) |
| `["valid", null, {url:"x"}, 42]` (mixed validity) | `[{url:"valid"}, {url:"x"}]` (skips invalids) |
| `{url: 42}` (object with non-string url) | filtered out |
| `[{url:""}]` (empty string url) | `[{url:""}]` — passes the typeof string check. **Risk**: next/image throws on empty src. Mitigated upstream by validating during upload (empty URL never written). |

### Every consumer of optional `blurDataURL`

Pattern is identical across every call site: `room.gallery.find(g => g.url === room.heroImage)?.blurDataURL` (or `entry.blurDataURL` directly in the gallery editor / RoomGalleryHero). Optional chaining yields `undefined` for missing; SmartImage's `hasBlur = typeof blurDataURL === "string" && blurDataURL.length > 0` correctly resolves to `false` → shimmer path. **Never** does `placeholder="blur"` get passed without a valid string.

### heroImage-in-gallery invariant

| Where heroImage is set | Invariant held? |
|---|---|
| Static `content.ts` (all 4 rooms) | ✓ verified: each room's `heroImage` exactly matches `gallery[0].url` |
| [uploadRoomImageAction:172-175](src/lib/admin/room-actions.ts#L172) — first upload | ✓ promotes the just-uploaded URL (which was simultaneously appended to gallery) |
| [setHeroImageAction:216](src/lib/admin/room-actions.ts#L216) | ✓ explicitly rejects URLs not in gallery |
| [deleteRoomImageAction:188-190](src/lib/admin/room-actions.ts#L188) — when hero is deleted | ✓ re-promotes `newGallery[0].url` if any remain |
| Manual Firestore edit | ⚠ no enforcement — if an operator edits `heroImage` to a bogus URL via the Firebase Console, the lookup returns undefined → shimmer (graceful) but the image itself 404s → SmartImage onError → fallback tile. **No crash.** |

**Cannot verify live Firestore here.** Listed in MUST TEST MANUALLY.

---

## Step 6 — Non-SmartImage paths

| Path | Status |
|---|---|
| **Hero** raw `<Image>` | ✓ Local public image with valid 1×1 charcoal PNG `BLUR_DATA_URL` (verified). `placeholder="blur"`, `preload`, `fill`, `sizes="100vw"`. |
| **DiningPreview** raw `<Image>` | ✓ **FIXED in this audit.** Added `placeholder="blur"` + 1×1 warm-cream `DINING_BLUR_DATA_URL` (verified). |
| **Email template images** | ✓ Template is text-only (no `<Img>`). If images are added later, MUST be absolute `https://...` URLs — documented in Master inventory. |
| **OG/metadata `room.heroImage`** | ✓ **FIXED in this audit.** Added `metadataBase: new URL(SITE_URL)` in root layout, so relative paths (e.g. static-content rooms' `/images/...`) auto-resolve to absolute URLs for scrapers. |
| **JSON-LD images** | ✓ No image fields in current ld+json blocks. Not a bug, just a SEO opportunity. |
| **Admin thumbnails** | ✓ Both admin list and gallery editor use SmartImage. |
| **CSS background-image** | ✓ One hit at [Hero.tsx:89](src/components/sections/Hero.tsx#L89) — a `linear-gradient(...)` scrim overlay, no raster image. Not flagged. |

---

## Step 7 — Edge cases

| Case | Behaviour | Verdict |
|---|---|---|
| Room with empty gallery | `RoomGalleryHero`: `images[0]` is undefined → `if (!active) return null` — no render, no crash. Other renderers use `room.heroImage` independently. GalleryEditor shows an empty-state card. | ✓ |
| heroImage = `""` | Public renderers would pass `src=""` to SmartImage → next/image throws. **The admin actions never set heroImage to `""`** — only to valid URLs. Only possible via direct Firestore edit. Manual-test note. | ⚠ Documented |
| heroImage 404 / 403 (expired Firebase token) | Ref callback catches `complete && naturalWidth === 0` (cached errors). Live errors fire onError. Either way → `setErrored(true)` → fallback tile with `ImageOff` icon. **Never a broken-image glyph.** | ✓ |
| Mixed portrait + landscape in gallery | Container `aspect-[4/3]` + `object-cover` crops cleanly. SmartImage with `fill` ignores width/height. **No layout break.** | ✓ |
| Freshly uploaded image, pre-revalidation | Upload action awaits Firestore write; `revalidateRoomPaths` invalidates the cache; gallery-editor's `useTransition` re-renders with fresh data. Blur is generated during the same request (same buffer), so the new entry has blur from first render — **no "No blur" flicker.** | ✓ |
| SSR/hydration | Initial state deterministic (`false`, `false`, src). Server HTML matches client first render exactly. Ref callback fires after mount → cached-image rescue. No hydration mismatch. | ✓ |
| JS-disabled user on a no-blur path | Server HTML ships Shimmer + opacity-0 `<img>`. Without JS to flip `loaded`, image stays invisible. Only affects entries without blur (static-content rooms + pre-backfill Firestore entries). | ⚠ Minor accessibility note. Future: add `<noscript>` fallback. |
| Same `src` re-renders | `src === trackedSrc` → no-op. ✓ |
| `prefers-reduced-motion: reduce` | Shimmer becomes a static cream tile (no sweep). Image fade still runs at 500ms — acceptable. | ✓ |

---

## MUST TEST MANUALLY

Static code verification cannot prove these — every one needs a browser, real Firebase, and DevTools. Test in order.

1. **Run backfill migration** — with live Firebase: `cd website && npm run backfill:blur`. Confirm the script logs upgraded entries for each room doc. Reload `/admin/rooms/<slug>` — amber "No blur" pills should disappear from all gallery entries.

2. **Slow 4G blur-first paint** — DevTools → Network → throttle to "Slow 4G" → reload `/rooms/deluxe` and `/rooms` (listing). Expect: every gallery image shows blur placeholder INSTANTLY (no blank gap), sharp image fades in as it streams down. Click gallery thumbs — same blur-first behaviour for each swap.

3. **Optimizer pipeline confirmation** — DevTools → Network → Img filter → reload any room page. Confirm image requests go to `/_next/image?url=...&w=...&q=...` paths, response Content-Type is `image/avif` (on Chrome) or `image/webp` (Safari/Firefox), **NOT** direct `firebasestorage.googleapis.com` with `image/jpeg`. If you see direct Firebase URLs in the Network panel for `<Image>`/`<SmartImage>` requests, the optimizer is being bypassed.

4. **Cache behaviour** — reload the same page twice. Expect second load images to come from disk cache (status `200 (from disk cache)` or `304`), essentially instant. This is the cached-image case that bug-fix #1 was for.

5. **CLS check** — Lighthouse on `/rooms/deluxe` (or `lighthouse http://localhost:3000/rooms/deluxe --view`). Confirm CLS < 0.1 and LCP improved vs the pre-Phase-5 baseline. Aspect-ratio containers on every fill image should hold zero CLS.

6. **Hard reload vs cached reload — proves bug-fix #1** —
   - With DevTools open, check "Disable cache" → hard-reload `/rooms` → images blur-up normally.
   - Uncheck "Disable cache" → hard-reload again → images should still appear (NOT stay invisible at opacity-0). This is the SSR-cache case the cached-image rescue handles.

7. **Expired Firebase URL → fallback tile** — in DevTools → Application → Storage, copy a Firebase Storage URL from a rendered image, then in the DevTools "Network → Block request URL" feature, block that URL with a wildcard. Reload. Expect: cream tile with faded `ImageOff` icon (`<div>` with `bg-cream`), not a broken-image glyph or blank space.

8. **Email preview** — make a booking (mock payment). With no `RESEND_API_KEY`, check `.email-previews/<bookingId>.html` was written. Open the file in a browser — confirm layout renders. (Template is text-only currently; if an image is added later, this is where you'd verify it loads from an absolute URL.)

9. **OG share preview** — set `NEXT_PUBLIC_SITE_URL` in `.env.local` to a publicly-reachable URL (e.g. an ngrok tunnel during dev). Visit `https://opengraph.dev/?url=<your-url>/rooms/deluxe` (or paste the link into Slack / WhatsApp / Twitter). Confirm the OG image preview shows the room hero, NOT a broken-image icon. This validates bug-fix #4 (metadataBase).

10. **heroImage-not-in-gallery edge case** — in the Firebase Console, manually edit a `rooms/<slug>` doc to set `heroImage` to some URL NOT present in its `gallery` array. Reload the public site. Expect: shimmer (no blur), image still loads, no crash. If image URL is genuinely broken: fallback tile.

11. **Mobile 390px sweep** — DevTools device emulation at 390x844 (iPhone). Walk `/`, `/rooms`, `/rooms/<slug>`, `/booking`, `/admin/rooms`. Confirm no horizontal scroll, no images broken out of their containers, tap targets stay ≥36px.

12. **Reduced-motion check** — DevTools → Rendering → "Emulate CSS media `prefers-reduced-motion: reduce`". Reload a no-blur page (e.g. an admin gallery entry pre-backfill). Confirm shimmer is a static cream tile (no sweep animation).

---

## Verification summary

- **Statically verified** (code trace): pipeline config, all `sizes` math, SmartImage's 6 branches (A–F), normalizeGallery's 8 input cases, every gallery+heroImage consumer, the heroImage-in-gallery invariant for static rooms + admin actions, Hero/DiningPreview blur constants are valid PNGs, SSR/hydration determinism, edge-case handling for empty gallery / portrait+landscape / cached-error.

- **Cannot verify without runtime** (manual test list above): actual AVIF/WebP conversion, real 30-day cache behaviour, real-network blur-up timing, Lighthouse CLS, social-card scraper resolution of metadataBase, Firestore data integrity (heroImage-in-gallery for production data), email rendering in real mail clients.

- **Bugs found: 5. Bugs fixed: 5.** Final gate: `npm run typecheck` clean, `npm run lint` zero warnings, `npm run build` clean.
